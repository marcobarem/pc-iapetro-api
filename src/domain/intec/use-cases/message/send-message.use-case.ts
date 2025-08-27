import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common'
import { SendMessageInput } from '@domain/intec/entities/dto/message'
import { ChatRepository, MessageRepository } from '@domain/intec/repositories'
import { TransactionRepository } from '@domain/intec/repositories/transaction.repository'
import { OpenAiService } from '@infra/ai/open-ai/open-ai.service'
import { Connection } from 'mongoose'
import { InjectConnection } from '@nestjs/mongoose'
import {
  startOfDay,
  addDays,
  parse,
  getYear,
  format,
  endOfYear,
  endOfMonth,
} from 'date-fns'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

@Injectable()
export class SendMessageUseCase {
  private readonly logger = new Logger(SendMessageUseCase.name)

  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly chatRepository: ChatRepository,
    private readonly messageRepository: MessageRepository,
    private readonly transactionRepository: TransactionRepository,
    private readonly iaApiService: OpenAiService,
  ) {}

  /**
   * Função auxiliar para injetar objetos Date JavaScript no pipeline do MongoDB,
   * substituindo os placeholders gerados pela IA.
   * As datas são convertidas para UTC 00:00:00Z para alinhar com o armazenamento no DB.
   * @param pipeline O pipeline de agregação com placeholders de data.
   * @param userQuestion A pergunta original do usuário para inferência de data.
   * @param chatHistory O histórico da conversa para inferência de data.
   * @returns O pipeline com objetos Date reais.
   */
  private injectDatesIntoPipeline(
    pipeline: any[],
    userQuestion: string,
    chatHistory: ChatMessage[],
  ): any[] {
    const clonedPipeline = JSON.parse(JSON.stringify(pipeline))
    const content = userQuestion

    for (const stage of clonedPipeline) {
      if (stage.$match && typeof stage.$match.supplyDate === 'string') {
        const datePlaceholder = stage.$match.supplyDate
        let startDate: Date | undefined
        let endDate: Date | undefined

        if (datePlaceholder === 'TODAY') {
          const now = new Date()
          startDate = new Date(
            Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
          )
          endDate = addDays(startDate, 1)
        } else if (datePlaceholder === 'YESTERDAY') {
          const yesterday = new Date()
          yesterday.setDate(yesterday.getDate() - 1)
          startDate = new Date(
            Date.UTC(
              yesterday.getUTCFullYear(),
              yesterday.getUTCMonth(),
              yesterday.getUTCDate(),
            ),
          )
          endDate = addDays(startDate, 1)
        } else if (datePlaceholder.startsWith('SPECIFIC_DATE_')) {
          const datePart = datePlaceholder.substring('SPECIFIC_DATE_'.length)
          const parsed = parse(datePart, 'dd/MM/yyyy', new Date())
          if (isNaN(parsed.getTime())) {
            this.logger.warn(
              `Data específica inválida no placeholder: "${datePlaceholder}". Usando hoje UTC.`,
            )
            const now = new Date()
            startDate = new Date(
              Date.UTC(
                now.getUTCFullYear(),
                now.getUTCMonth(),
                now.getUTCDate(),
              ),
            )
            endDate = addDays(startDate, 1)
          } else {
            startDate = new Date(
              Date.UTC(
                parsed.getFullYear(),
                parsed.getMonth(),
                parsed.getDate(),
              ),
            )
            endDate = addDays(startDate, 1)
          }
        } else if (datePlaceholder.startsWith('MONTH_')) {
          const monthPart = datePlaceholder.substring('MONTH_'.length)
          const [monthStr, yearStr] = monthPart.split('/')
          const year = parseInt(yearStr, 10)
          const month = parseInt(monthStr, 10) - 1

          if (isNaN(year) || isNaN(month)) {
            this.logger.warn(
              `Mês/Ano inválido no placeholder: "${datePlaceholder}". Usando hoje UTC.`,
            )
            const now = new Date()
            startDate = new Date(
              Date.UTC(
                now.getUTCFullYear(),
                now.getUTCMonth(),
                now.getUTCDate(),
              ),
            )
            endDate = addDays(startDate, 1)
          } else {
            startDate = new Date(Date.UTC(year, month, 1))
            endDate = new Date(Date.UTC(year, month + 1, 1))
          }
        } else if (datePlaceholder.startsWith('YEAR_')) {
          const yearStr = datePlaceholder.substring('YEAR_'.length)
          const year = parseInt(yearStr, 10)

          if (isNaN(year)) {
            this.logger.warn(
              `Ano inválido no placeholder: "${datePlaceholder}". Usando hoje UTC.`,
            )
            const now = new Date()
            startDate = new Date(
              Date.UTC(
                now.getUTCFullYear(),
                now.getUTCMonth(),
                now.getUTCDate(),
              ),
            )
            endDate = addDays(startDate, 1)
          } else {
            startDate = new Date(Date.UTC(year, 0, 1))
            endDate = new Date(Date.UTC(year + 1, 0, 1))
          }
        }

        if (startDate && endDate) {
          stage.$match.supplyDate = {
            $gte: startDate,
            $lt: endDate,
          }
          this.logger.debug(
            `Data placeholder '${datePlaceholder}' substituído por range UTC: ${startDate.toISOString()} a ${endDate.toISOString()}`,
          )
        } else if (datePlaceholder !== 'ALL_TIME') {
          this.logger.error(
            `Não foi possível determinar range de data para placeholder: "${datePlaceholder}". Removendo filtro de data.`,
          )
          delete stage.$match.supplyDate
        }
      } else if (stage.$match && stage.$match.supplyDate === 'ALL_TIME') {
        this.logger.debug(
          `Placeholder 'ALL_TIME' encontrado. Removendo filtro de data para supplyDate.`,
        )
        delete stage.$match.supplyDate
      }
    }
    return clonedPipeline
  }

  async execute(input: SendMessageInput, userId: string) {
    const session = await this.connection.startSession()

    try {
      session.startTransaction()

      const { chatId, content } = input

      let resolvedChatId = chatId
      let chatHistory: ChatMessage[] = []

      if (!chatId) {
        const titleIaAnswer = await this.iaApiService.generateTitle(content)
        const title =
          titleIaAnswer.choices[0].message.content?.trim() ?? 'Novo Chat'

        const chat = await this.chatRepository.create(
          { title, userId },
          session,
        )
        resolvedChatId = chat._id
        this.logger.log(`Novo chat criado com ID: ${resolvedChatId}`)
      } else {
        const messages = await this.messageRepository.findMany(
          { chatId: resolvedChatId, userId },
          {},
          { sort: { createdAt: -1 }, limit: 10 },
        )
        chatHistory = messages.map(msg => ({
          role: msg.role === 'ia' ? 'assistant' : 'user',
          content: msg.content,
        }))
        this.logger.log(
          `Histórico de chat (${chatHistory.length} mensagens) carregado para chat ID: ${resolvedChatId}`,
        )
      }

      if (!resolvedChatId) {
        throw new HttpException(
          'Chat ID could not be resolved.',
          HttpStatus.INTERNAL_SERVER_ERROR,
        )
      }

      this.logger.log(
        `Etapa 1: Gerando query para a mensagem: "${content}" com histórico.`,
      )
      const iaQueryResponse = await this.iaApiService.generateMongoQuery(
        content,
        chatHistory,
      )
      let iaAnswerContent: string

      if (iaQueryResponse.intent === 'clarification_needed') {
        iaAnswerContent = iaQueryResponse.message
        this.logger.log(
          `Etapa 1: IA solicitou esclarecimento: "${iaAnswerContent}"`,
        )
      } else if (iaQueryResponse.intent === 'error') {
        iaAnswerContent = iaQueryResponse.message
        this.logger.error(
          `Etapa 1: Erro na geração da query pela IA: "${iaAnswerContent}"`,
        )
      } else {
        const mongoPipeline = iaQueryResponse.mongo_query_pipeline

        if (!mongoPipeline) {
          iaAnswerContent =
            'Desculpe, não consegui entender sua solicitação para consultar os dados. Por favor, reformule.'
          this.logger.warn(
            'Etapa 1: IA retornou intenção válida, mas pipeline vazio.',
          )
        } else {
          this.logger.log(
            'Etapa 2: Substituindo placeholders de data no pipeline.',
          )
          const executablePipeline = this.injectDatesIntoPipeline(
            mongoPipeline,
            content,
            chatHistory,
          )

          this.logger.log(
            `Etapa 2: Executando pipeline no MongoDB: ${JSON.stringify(executablePipeline)}`,
          )
          const queryResult =
            await this.transactionRepository.aggregate(executablePipeline)
          this.logger.log(
            `Etapa 2: Resultado da query MongoDB: ${JSON.stringify(queryResult)}`,
          )

          this.logger.log('Etapa 3: Humanizando a resposta da IA.')
          iaAnswerContent = await this.iaApiService.humanizeResponse(
            content,
            queryResult,
            chatHistory,
          )
          this.logger.log(`Etapa 3: Resposta humanizada: "${iaAnswerContent}"`)
        }
      }

      const userMessage = await this.messageRepository.create(
        {
          chatId: resolvedChatId,
          userId,
          role: 'user',
          content,
        },
        session,
      )

      const iaMessage = await this.messageRepository.create(
        {
          chatId: resolvedChatId,
          userId,
          role: 'ia',
          content: iaAnswerContent,
        },
        session,
      )

      await session.commitTransaction()
      this.logger.log('Transação de mensagem commitada com sucesso.')

      return {
        messages: [userMessage, iaMessage],
      }
    } catch (error) {
      this.logger.error('Erro ao enviar mensagem:', error)
      await session.abortTransaction()
      this.logger.error('Transação de mensagem abortada.')
      throw new HttpException(
        'Erro ao processar mensagem',
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    } finally {
      session.endSession()
      this.logger.log('Sessão do MongoDB para mensagem finalizada.')
    }
  }
}

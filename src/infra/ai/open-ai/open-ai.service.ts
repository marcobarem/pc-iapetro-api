import axios, { AxiosError, AxiosResponse } from 'axios'
import { Injectable, Logger } from '@nestjs/common'
import { EnvService } from '@infra/env'

interface Messages {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface ChatCompletionRequest {
  messages: Messages[]
  maxTokens?: number
  temperature: number
  frequencyPenalty?: number
  presencePenalty?: number
  topP?: number
  stop?: null
}

interface ChatCompletionResponse {
  id: string
  object: string
  created: number
  model: string
  prompt_annotations: [
    {
      prompt_index: number
      content_filter_results: {
        hate: { filtered: boolean; severity: string }
        self_harm: { filtered: boolean; severity: string }
        sexual: { filtered: boolean; severity: string }
        violence: { filtered: boolean; severity: string }
      }
    },
  ]
  choices: [
    {
      index: number
      finish_reason: string
      message: { role: string; content: string }
      content_filter_results: {
        hate: { filtered: boolean; severity: string }
        self_harm: { filtered: boolean; severity: string }
        sexual: { filtered: boolean; severity: string }
        violence: { filtered: boolean; severity: string }
      }
    },
  ]
  usage: {
    completion_tokens: number
    prompt_tokens: number
    total_tokens: number
  }
}

@Injectable()
export class OpenAiService {
  private readonly endpoint: string
  private readonly apiKey: string
  private readonly deploymentName: string
  private readonly logger = new Logger(OpenAiService.name)

  constructor(private readonly envService: EnvService) {
    this.endpoint = this.envService.get('AZURE_OPENAI_ENDPOINT')!
    this.apiKey = this.envService.get('AZURE_OPENAI_API_KEY')!
    this.deploymentName = this.envService.get('AZURE_OPENAI_DEPLOYMENT')!
  }

  async ask({
    frequencyPenalty,
    maxTokens,
    messages,
    presencePenalty,
    stop,
    temperature,
    topP,
  }: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    try {
      const url = `${this.endpoint}openai/deployments/${this.deploymentName}/chat/completions?api-version=2024-08-01-preview`

      const response: AxiosResponse<ChatCompletionResponse> = await axios.post(
        url,
        {
          messages,
          max_tokens: maxTokens,
          temperature,
          frequency_penalty: frequencyPenalty,
          presence_penalty: presencePenalty,
          top_p: topP,
          stop,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'api-key': this.apiKey,
          },
        },
      )

      return response.data
    } catch (err) {
      if (err instanceof AxiosError) {
        this.logger.error(
          'Erro na chamada ao Azure OpenAI:',
          JSON.stringify(err.response?.data, null, 2),
        )
        throw err
      }
      this.logger.error('Erro desconhecido na chamada ao OpenAI:', err)
      throw new Error('Erro desconhecido na chamada ao OpenAI')
    }
  }

  async generateTitle(content: string): Promise<ChatCompletionResponse> {
    return this.ask({
      messages: [
        {
          role: 'user',
          content: `
            - Você vai gerar um título curto baseado na primeira mensagem que o usuário inicia uma conversa.
            - Certifique-se de que não tem mais de 80 caracteres.
            - O título deve ser um resumo da mensagem do usuário.
            - Não use aspas ou dois pontos.
            - Mensagem do usuário: "${JSON.stringify(content)}"

            - Responda em português, e apenas o título sem nenhum outro complemento.
          `,
        },
      ],
      maxTokens: 100,
      temperature: 0.5,
      frequencyPenalty: 0.5,
      presencePenalty: 0,
      topP: 0.95,
      stop: null,
    })
  }

  async generateMongoQuery(
    userMessage: string,
    chatHistory: Messages[] = [],
  ): Promise<any> {
    const systemPrompt = `
      Você é um assistente especializado em gerar queries de agregação do MongoDB para dados de transações de postos de combustível.
      Seu objetivo é analisar a pergunta do usuário e o CONTEXTO da conversa (histórico de mensagens) para retornar APENAS um objeto JSON.

      **IMPORTANTE: A SAÍDA DEVE SER SEMPRE UM JSON VÁLIDO E PERFEITAMENTE FORMATADO, SEM VÍRGULAS EXTRAS OU ERROS DE SINTAXE.**
      **NÃO USE PLACEHOLDERS COMO START_OF_DAY_YYYY-MM-DD, START_OF_NEXT_DAY_YYYY-MM-DD, END_OF_DAY_YYYY-MM-DD.**
      **USE APENAS OS PLACEHOLDERS DE DATA SIMPLIFICADOS FORNECIDOS ABAIXO.**

      **ESQUEMA DE DADOS DA COLEÇÃO 'transactions':**
      ${JSON.stringify(
        {
          supplyDate: 'Date (data e hora do abastecimento, em UTC)',
          supplyTime: 'String (hora do abastecimento)',
          fiscalDate: 'Date (Data Fiscal, em UTC)',
          fiscalTime: 'String (Hora Fiscal)',
          supplyVsSale: 'String (Abast. x Venda)',
          nozzle: 'String (Bico)',
          coupon: 'String (Cupom)',
          employeeName: 'String (Funcionario)',
          product:
            'String (Produto)("GASOLINA C COMUM", "ETANOL HIDRATADO COMUM", "GASOLINA ADITIVADA GRID", "ETANOL ADITIVADO", "GASOLINA PODIUM")',
          quantity: 'Number (Quantidade em litros)',
          unitPrice: 'Number (Preço unitário)',
          value: 'Number (Valor total da venda)',
          initialCounter: 'Number (Encerrante Inicial)',
          finalCounter: 'Number (Encerrante Final)',
          calibration: 'Boolean (Aferição)',
          movementDate: 'Date (Data Movimento, em UTC)',
          priceA: 'Number (Preço A)',
          priceB: 'Number (Preço B)',
          priceC: 'Number (Preço C)',
          record: 'String (Registro)',
          substitution: 'String (Substituição)',
        },
        null,
        2,
      )}

      **REGRAS IMPORTANTES para o objeto JSON de resposta:**
      - O objeto JSON deve ter as chaves 'intent' e 'mongo_query_pipeline' (ou 'message' se for 'clarification_needed').
      - 'intent': Uma string que classifica a intenção do usuário. As intenções suportadas são:
          - 'top_employee_sales': Para perguntas sobre quem vendeu mais (por valor).
          - 'total_liters_sold': Para perguntas sobre a quantidade total de litros vendidos.
          - 'average_price': Para perguntas sobre a média de preço unitário.
          - 'top_product_sales': Para perguntas sobre qual combustível/produto vendeu mais (por quantidade de litros).
          - 'clarification_needed': Se a pergunta for ambígua, incompleta ou requerer mais informações que não podem ser inferidas do contexto.
      - 'mongo_query_pipeline': Um array JSON que representa o pipeline de agregação do MongoDB.
        - A coleção é sempre 'transactions'.
        - Use $match, $group, $sort, $limit conforme necessário.
        - Utilize os campos do esquema de dados fornecido (ex: 'employeeName', 'value', 'quantity', 'product', 'supplyDate', 'unitPrice').

      **REGRAS ESPECÍFICAS PARA FILTROS DE DATA ('supplyDate'):**
      1. Se a pergunta especificar um período, inclua um estágio '$match' no pipeline.
      2. **PLACEHOLDERS SIMPLIFICADOS (o backend converterá para UTC):**
         - "TODAY": Para o dia atual (ex: "hoje").
         - "YESTERDAY": Para o dia de ontem (ex: "ontem").
         - "SPECIFIC_DATE_DD/MM/YYYY": Para uma data exata (ex: "14/04/2025" -> "SPECIFIC_DATE_14/04/2025").
         - "MONTH_MM/YYYY": Para um mês específico (ex: "mês 04/2025" -> "MONTH_04/2025").
         - "YEAR_YYYY": Para um ano específico (ex: "ano 2024" -> "YEAR_2024").
      3. Se a pergunta sobre um total (litros, vendas, etc.) não especificar data/período, retorne 'clarification_needed'.
      4. Se a pergunta sobre um "top" (quem vendeu mais, qual produto mais vendido) não especificar data/período, OMITA o estágio '$match' de data para consultar o total geral.

      **REGRAS ESPECÍFICAS PARA FILTROS DE PRODUTO ('product'):**
      - Se a pergunta especificar um tipo de combustível/produto (ex: "gasolina", "etanol"), inclua um filtro no estágio '$match' para o campo 'product'. Use um regex para ser mais flexível, ex: '{ "product": { "$regex": "gasolina", "$options": "i" } }' (case-insensitive).
      - Lembrando que os produtos são da seguinte variação: "GASOLINA C COMUM", "ETANOL HIDRATADO COMUM", "GASOLINA ADITIVADA GRID", "ETANOL ADITIVADO", "GASOLINA PODIUM".

      **Exemplos de Perguntas e Respostas JSON:**

      --- TOP EMPLOYEE SALES ---
      Pergunta: "Quem vendeu mais?"
      Resposta: {"intent": "top_employee_sales", "mongo_query_pipeline": [{ "$group": { "_id": "$employeeName", "totalSalesValue": { "$sum": "$value" } } }, { "$sort": { "totalSalesValue": -1 } }, { "$limit": 1 }]}

      Pergunta: "Quem vendeu mais hoje?"
      Resposta: {"intent": "top_employee_sales", "mongo_query_pipeline": [{ "$match": { "supplyDate": "TODAY" } }, { "$group": { "_id": "$employeeName", "totalSalesValue": { "$sum": "$value" } } }, { "$sort": { "totalSalesValue": -1 } }, { "$limit": 1 }]}

      Pergunta: "Quem vendeu mais no dia 14/04/2025?"
      Resposta: {"intent": "top_employee_sales", "mongo_query_pipeline": [{ "$match": { "supplyDate": "SPECIFIC_DATE_14/04/2025" } }, { "$group": { "_id": "$employeeName", "totalSalesValue": { "$sum": "$value" } } }, { "$sort": { "totalSalesValue": -1 } }, { "$limit": 1 }]}

      Pergunta: "Qual frentista vendeu mais gasolina em 2024?"
      Resposta: {"intent": "top_employee_sales", "mongo_query_pipeline": [{ "$match": { "supplyDate": "YEAR_2024", "product": { "$regex": "gasolina", "$options": "i" } } }, { "$group": { "_id": "$employeeName", "totalSalesValue": { "$sum": "$value" } } }, { "$sort": { "totalSalesValue": -1 } }, { "$limit": 1 }]}

      Pergunta: "E do dia 15/04?" (com histórico de "Quem vendeu mais gasolina no dia 14/04/2025?")
      Resposta: {"intent": "top_employee_sales", "mongo_query_pipeline": [{ "$match": { "supplyDate": "SPECIFIC_DATE_15/04/2025", "product": { "$regex": "gasolina", "$options": "i" } } }, { "$group": { "_id": "$employeeName", "totalSalesValue": { "$sum": "$value" } } }, { "$sort": { "totalSalesValue": -1 } }, { "$limit": 1 }]}

      --- TOTAL LITERS SOLD ---
      Pergunta: "Quantos litros foram vendidos?"
      Resposta: {"intent": "clarification_needed", "message": "Por favor, especifique a data ou o período para qual você deseja essa informação."}

      Pergunta: "Quantos litros de etanol foram vendidos hoje?"
      Resposta: {"intent": "total_liters_sold", "mongo_query_pipeline": [{ "$match": { "supplyDate": "TODAY", "product": { "$regex": "etanol", "$options": "i" } } }, { "$group": { "_id": null, "totalLitros": { "$sum": "$quantity" } } }]}

      Pergunta: "Quantos litros no mês de maio de 2025?"
      Resposta: {"intent": "total_liters_sold", "mongo_query_pipeline": [{ "$match": { "supplyDate": "MONTH_05/2025" } }, { "$group": { "_id": null, "totalLitros": { "$sum": "$quantity" } } }]}

      --- AVERAGE PRICE ---
      Pergunta: "Qual foi a média de preço?"
      Resposta: {"intent": "average_price", "mongo_query_pipeline": [{ "$group": { "_id": null, "averageUnitPrice": { "$avg": "$unitPrice" } } }]}

      Pergunta: "Qual a média de preço da gasolina em 2024?"
      Resposta: {"intent": "average_price", "mongo_query_pipeline": [{ "$match": { "supplyDate": "YEAR_2024", "product": { "$regex": "gasolina", "$options": "i" } } }, { "$group": { "_id": null, "averageUnitPrice": { "$avg": "$unitPrice" } } }]}

      --- TOP PRODUCT SALES ---
      Pergunta: "Qual combustível vendeu mais?"
      Resposta: {"intent": "top_product_sales", "mongo_query_pipeline": [{ "$group": { "_id": "$product", "totalQuantity": { "$sum": "$quantity" } } }, { "$sort": { "totalQuantity": -1 } }, { "$limit": 1 }]}

      Pergunta: "Qual produto vendeu mais no dia 14/04/2025?"
      Resposta: {"intent": "top_product_sales", "mongo_query_pipeline": [{ "$match": { "supplyDate": "SPECIFIC_DATE_14/04/2025" } }, { "$group": { "_id": "$product", "totalQuantity": { "$sum": "$quantity" } } }, { "$sort": { "totalQuantity": -1 } }, { "$limit": 1 }]}

      Sua resposta para a pergunta do usuário: "${userMessage}"
    `

    const messagesToSend: Messages[] = [
      { role: 'system', content: systemPrompt },
      ...chatHistory,
      { role: 'user', content: userMessage },
    ]

    try {
      const response = await this.ask({
        messages: messagesToSend,
        maxTokens: 700,
        temperature: 0.1,
        frequencyPenalty: 0,
        presencePenalty: 0,
        topP: 0.95,
        stop: null,
      })

      const responseContent = response.choices[0].message.content?.trim()
      this.logger.debug(
        `IA Query Generation Response (Raw): ${responseContent}`,
      )

      try {
        const parsedResponse = JSON.parse(responseContent)
        return parsedResponse
      } catch (jsonError) {
        this.logger.error(
          `Falha ao parsear JSON da IA: ${jsonError}. Conteúdo Bruto: ${responseContent}`,
        )
        return {
          intent: 'error',
          message:
            'Houve um erro ao processar sua solicitação devido a um JSON inválido da IA. Por favor, tente novamente.',
        }
      }
    } catch (error) {
      this.logger.error('Erro ao gerar query do MongoDB pela IA:', error)
      throw error
    }
  }

  async humanizeResponse(
    userQuestion: string,
    queryResult: any,
    chatHistory: Messages[] = [],
  ): Promise<string> {
    const systemPrompt = `
      Você é um assistente de IA.
      A pergunta original do usuário foi: "${userQuestion}".
      O resultado da consulta ao banco de dados foi: ${JSON.stringify(queryResult)}.
      Com base nessas informações e no histórico da conversa, forneça uma resposta clara, concisa e amigável em português para o usuário.
      Não adicione introduções como "De acordo com os dados..." ou "A resposta é...". Vá direto ao ponto, humanizando a informação.
      Se o resultado for vazio, um array vazio ou indicar que não há dados relevantes (ex: "totalSalesValue": 0), responda de forma apropriada, como "Não foi possível encontrar informações para a sua solicitação." ou "Nenhum dado encontrado para [período/critério]".
      Se o resultado tiver valores numéricos, formate-os com duas casas decimais para valores monetários (ex: R$ 15.000,00) e use ponto para milhar e vírgula para decimal (ex: 5.500 litros).

      Exemplos de humanização:
      Pergunta: "Quem vendeu mais?"
      Resultado: [{"_id": "João Silva", "totalSalesValue": 15000}]
      Resposta Humanizada: O funcionário que mais vendeu foi João Silva, com um total de R$ 15.000,00 em vendas.

      Pergunta: "Quem vendeu mais hoje?"
      Resultado: [{"_id": "Maria Souza", "totalSalesValue": 8000}]
      Resposta Humanizada: Hoje, a funcionária que mais vendeu foi Maria Souza, com um total de R$ 8.000,00 em vendas.

      Pergunta: "Quem vendeu mais no dia 14/04/2025?"
      Resultado: [{"_id": "ROBERTO SOUZA LIMA", "totalSalesValue": 989.47}]
      Resposta Humanizada: No dia 14/04/2025, o funcionário que mais vendeu foi ROBERTO SOUZA LIMA, com um total de R$ 989,47 em vendas.

      Pergunta: "E ontem?"
      Resultado: []
      Resposta Humanizada: Não foi possível encontrar dados de vendas para ontem.

      Resposta para o usuário:
    `

    const messagesToSend: Messages[] = [
      { role: 'system', content: systemPrompt },
      ...chatHistory,
      { role: 'user', content: userQuestion },
      {
        role: 'assistant',
        content: `Resultado da consulta: ${JSON.stringify(queryResult)}`,
      },
    ]

    try {
      const response = await this.ask({
        messages: messagesToSend,
        maxTokens: 150,
        temperature: 0.7,
        frequencyPenalty: 0,
        presencePenalty: 0,
        topP: 0.95,
        stop: null,
      })

      return (
        response.choices[0].message.content?.trim() ??
        'Não foi possível gerar uma resposta.'
      )
    } catch (error) {
      this.logger.error('Erro ao humanizar resposta pela IA:', error)
      return 'Desculpe, não consegui formatar a resposta no momento. Por favor, tente novamente mais tarde.'
    }
  }
}

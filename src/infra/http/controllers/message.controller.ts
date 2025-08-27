import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'

import { UserData } from '@core/decorators/user.decorator'

import {
  GetMessagesByChatIdUseCase,
  SendMessageUseCase,
} from '@domain/intec/use-cases/message'
import { SendMessageInput } from '@domain/intec/entities/dto/message'

import { UserPayload } from '@infra/auth/jwt-strategy'
import { ChatOwnershipGuard } from '../guards/chat-ownership.guard'

@Controller('messages')
@ApiTags('Messages')
@ApiBearerAuth()
export class MessageController {
  constructor(
    private readonly sendMessageUseCase: SendMessageUseCase,
    private readonly getMessagesByChatId: GetMessagesByChatIdUseCase,
  ) {}

  @Post('/send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Enviar mensagem ao modelo de IA',
    description:
      'Envia uma mensagem, cria o chat se necessário, armazena mensagens do usuário e da IA.',
  })
  @ApiBody({ type: SendMessageInput })
  @ApiResponse({
    status: 200,
    description: 'Mensagens enviadas com sucesso',
    schema: {
      example: {
        messages: [
          {
            _id: '...',
            chatId: '...',
            userId: '...',
            content: 'mensagem do usuário',
            role: 'user',
            createdAt: '...',
          },
          {
            _id: '...',
            chatId: '...',
            userId: '...',
            content: 'resposta da IA',
            role: 'ia',
            createdAt: '...',
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Erro ao enviar mensagem',
    schema: {
      example: {
        statusCode: 500,
        message: 'Erro ao processar mensagem',
      },
    },
  })
  @UseGuards(ChatOwnershipGuard)
  async sendMessage(
    @Body() input: SendMessageInput,
    @UserData() user: UserPayload,
  ) {
    return this.sendMessageUseCase.execute(input, user.sub)
  }

  @Get('')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Recuperar mensagens de um chat',
    description: 'Retorna todas as mensagens de um chat específico.',
  })
  @ApiQuery({ name: 'chatId', required: true, description: 'ID do chat' })
  @ApiResponse({
    status: 200,
    description: 'Mensagens recuperadas com sucesso',
    schema: {
      example: {
        messages: [
          {
            _id: '...',
            chatId: '...',
            userId: '...',
            content: 'mensagem do usuário',
            role: 'user',
            createdAt: '...',
          },
          {
            _id: '...',
            chatId: '...',
            userId: '...',
            content: 'mensagem da IA',
            role: 'ia',
            createdAt: '...',
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Chat não encontrado',
  })
  @ApiResponse({
    status: 403,
    description: 'Usuário não tem permissão para acessar este chat',
  })
  async getMessagesFromChat(
    @UserData() user: UserPayload,
    @Query('chatId') chatId: string,
  ) {
    return this.getMessagesByChatId.execute(chatId, user.sub)
  }
}

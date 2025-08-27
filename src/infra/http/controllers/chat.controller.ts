import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'

import { UserData } from '@core/decorators/user.decorator'

import { GetChatsUseCase } from '@domain/intec/use-cases/chat'

import { UserPayload } from '@infra/auth/jwt-strategy'

@Controller('chats')
@ApiTags('Chats')
@ApiBearerAuth()
export class ChatController {
  constructor(private readonly getChatsUseCase: GetChatsUseCase) {}

  @Get('/')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Recuperar todos os chats do usuário',
    description:
      'Retorna uma lista de todos os chats associados ao usuário logado.',
  })
  @ApiResponse({
    status: 200,
    description: 'Chats recuperados com sucesso',
    schema: {
      example: {
        chats: [
          {
            _id: 'chatId123',
            userId: 'userId456',
            title: 'Conversa com IA sobre marketing',
            createdAt: '2023-10-26T10:00:00Z',
            updatedAt: '2023-10-26T10:00:00Z',
          },
          {
            _id: 'chatId789',
            userId: 'userId456',
            title: 'Suporte técnico',
            createdAt: '2023-10-25T14:30:00Z',
            updatedAt: '2023-10-25T14:30:00Z',
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Erro interno do servidor',
  })
  async getChats(@UserData() user: UserPayload) {
    const chats = await this.getChatsUseCase.execute(user.sub)
    return { chats }
  }
}

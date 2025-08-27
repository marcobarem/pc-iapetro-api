import { Module } from '@nestjs/common'
import { APP_FILTER } from '@nestjs/core'

import { GlobalExceptionFilter } from './exeptions/global-exeption.filter'

import { DatabaseModule } from '@infra/database/database.module'
import { CryptographyModule } from '@infra/cryptography'
import { EnvModule } from '@infra/env'
import { OpenAiModule } from '@infra/ai/open-ai/open-ai.module'

import {
  AuthController,
  ChatController,
  HealthController,
  MessageController,
  TransactionsController,
  UserController,
} from './controllers'

import {
  CreateUserUseCase,
  GetUserUseCase,
  LoginUserUseCase,
} from '@domain/intec/use-cases/user'
import {
  GetMessagesByChatIdUseCase,
  SendMessageUseCase,
} from '@domain/intec/use-cases/message'
import { ValidateChatOwnershipUseCase } from '@domain/intec/use-cases/chat'
import { GetChatsUseCase } from '@domain/intec/use-cases/chat/get-chats.use-case'
import { ImportTransactionsUseCase } from '@domain/intec/use-cases/transaction/upload-transactions.use-case'

@Module({
  imports: [CryptographyModule, EnvModule, DatabaseModule, OpenAiModule],
  controllers: [
    AuthController,
    ChatController,
    HealthController,
    MessageController,
    UserController,
    TransactionsController,
  ],
  providers: [
    CreateUserUseCase,
    GetUserUseCase,
    LoginUserUseCase,
    CreateUserUseCase,
    SendMessageUseCase,
    ValidateChatOwnershipUseCase,
    GetMessagesByChatIdUseCase,
    GetChatsUseCase,
    ImportTransactionsUseCase,
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class HttpModule {}

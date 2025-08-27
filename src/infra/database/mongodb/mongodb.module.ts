import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'

import { Chat, Message, User } from '@core/entities'
import {
  ChatRepository,
  MessageRepository,
  TransactionRepository,
  UserRepository,
} from '@domain/intec/repositories'

import { EnvModule, EnvService } from '@infra/env'

import {
  MongoChatRepository,
  MongoTransactionRepository,
  MongoUserRepository,
} from './repositories'
import {
  ChatSchema,
  MessageSchema,
  Transaction,
  TransactionSchema,
  UserSchema,
} from './schemas'
import { MongoMessageRepository } from './repositories/mongo-message.repository'

@Module({
  imports: [
    EnvModule,
    MongooseModule.forRootAsync({
      imports: [EnvModule],
      useFactory: (envService: EnvService) => ({
        uri: envService.get('DATABASE_URL'),
        dbName: envService.get('DATABASE_NAME'),
      }),
      inject: [EnvService],
    }),
    MongooseModule.forFeature([
      {
        name: User.name,
        schema: UserSchema,
      },
      {
        name: Chat.name,
        schema: ChatSchema,
      },
      {
        name: Message.name,
        schema: MessageSchema,
      },
      {
        name: Transaction.name,
        schema: TransactionSchema,
      },
    ]),
  ],
  providers: [
    EnvService,
    {
      provide: UserRepository,
      useClass: MongoUserRepository,
    },
    {
      provide: ChatRepository,
      useClass: MongoChatRepository,
    },
    {
      provide: MessageRepository,
      useClass: MongoMessageRepository,
    },
    {
      provide: TransactionRepository,
      useClass: MongoTransactionRepository,
    },
  ],
  exports: [
    MongooseModule,
    UserRepository,
    ChatRepository,
    MessageRepository,
    TransactionRepository,
  ],
})
export class MongoDbModule {}

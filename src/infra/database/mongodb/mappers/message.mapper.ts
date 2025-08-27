import { Types } from 'mongoose'

import { Message } from '@core/entities/message.entity'

import { MessageDocument } from '../schemas/message.schema'

export class MessageMapper {
  static toEntity(document: MessageDocument): Message {
    return new Message(
      document._id?.toString() || '',
      document.chatId.toString(),
      document.userId.toString(),
      document.role,
      document.content,
      document.createdAt,
      document.updatedAt,
    )
  }

  static toSchema(entity: Omit<Message, '_id' | 'createdAt' | 'updatedAt'>) {
    const data = {
      chatId: new Types.ObjectId(entity.chatId),
      userId: new Types.ObjectId(entity.userId),
      role: entity.role,
      content: entity.content,
    }

    return {
      chatId: new Types.ObjectId(entity.chatId),
      userId: new Types.ObjectId(entity.userId),
      role: entity.role,
      content: entity.content,
    }
  }
}

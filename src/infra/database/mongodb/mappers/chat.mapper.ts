import { Types } from 'mongoose'

import { Chat } from '@core/entities/chat.entity'

import { ChatDocument } from '../schemas/chat.schema'

export class ChatMapper {
  static toEntity(document: ChatDocument): Chat {
    return new Chat(
      document._id?.toString() || '',
      document.userId.toString(),
      document.title,
      document.createdAt,
      document.updatedAt,
    )
  }

  static toSchema(entity: Omit<Chat, '_id' | 'createdAt' | 'updatedAt'>) {
    return {
      userId: new Types.ObjectId(entity.userId),
      title: entity.title,
    }
  }
}

import { ClientSession, QueryOptions } from 'mongoose'

import { Message } from '@core/entities'
import { Projection } from '@core/@types'

export abstract class MessageRepository {
  abstract create(
    message: Omit<Message, '_id' | 'createdAt' | 'updatedAt'>,
    session?: ClientSession | null,
  ): Promise<Message>

  abstract findById(
    id: string,
    projection?: Projection<Message>,
    options?: QueryOptions,
  ): Promise<Message | null>

  abstract findMany(
    query: Record<string, any>,
    projection?: Projection<Message>,
    options?: QueryOptions,
  ): Promise<Message[]>
  abstract findByChatId(
    chatId: string,
    projection?: Projection<Message>,
    options?: QueryOptions,
  ): Promise<Message[]>
  abstract findByUserId(
    userId: string,
    projection?: Projection<Message>,
    options?: QueryOptions,
  ): Promise<Message[]>
}

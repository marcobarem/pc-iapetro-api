import { ClientSession, QueryOptions } from 'mongoose'

import { Chat } from '@core/entities'
import { Projection } from '@core/@types'

export abstract class ChatRepository {
  abstract create(
    chatData: Omit<Chat, '_id' | 'createdAt' | 'updatedAt'>,
    session?: ClientSession | null,
  ): Promise<Chat>
  abstract findById(id: string, userId: string): Promise<Chat | null>
  abstract findAllByUser(
    userId: string,
    projection?: Projection<Chat>,
    options?: QueryOptions,
  ): Promise<Chat[]>
  abstract findMany(
    query: Record<string, any>,
    projection?: Projection<Chat>,
    options?: QueryOptions,
  ): Promise<Chat[]>
  abstract count(query: Record<string, any>): Promise<number>
  abstract deleteById(id: string, userId: string): Promise<void>
  abstract bulkWrite(operations: any[], session?: ClientSession): Promise<any>
  abstract aggregate(pipeline: any[]): Promise<any>
}

import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, ClientSession, QueryOptions } from 'mongoose'

import { Chat } from '@core/entities/chat.entity'
import { ChatRepository } from '@domain/intec/repositories/chat.repository'

import { ChatMapper } from '@infra/database/mongodb/mappers/chat.mapper'
import { ChatDocument } from '@infra/database/mongodb/schemas/chat.schema'
import { Projection } from '@core/@types'

@Injectable()
export class MongoChatRepository implements ChatRepository {
  constructor(
    @InjectModel('Chat') private readonly chatModel: Model<ChatDocument>,
  ) {}

  async create(
    chatData: Omit<Chat, '_id' | 'createdAt' | 'updatedAt'>,
    session: ClientSession | null = null,
  ): Promise<Chat> {
    const createdChat = new this.chatModel(ChatMapper.toSchema(chatData))
    const savedChat = await createdChat.save({ session })

    return ChatMapper.toEntity(savedChat)
  }

  async findById(
    id: string,
    userId: string,
    projection?: Projection<Chat>,
  ): Promise<Chat | null> {
    const chat = await this.chatModel
      .findOne({ _id: id, userId }, projection)
      .lean()

    return chat ? ChatMapper.toEntity(chat) : null
  }

  async findAllByUser(
    userId: string,
    projection?: Projection<Chat>,
    options?: QueryOptions,
  ): Promise<Chat[]> {
    const chats = await this.chatModel
      .find({ userId }, projection, options)
      .lean()

    return chats.map(ChatMapper.toEntity)
  }

  async updateById(
    id: string,
    userId: string,
    update: Partial<Chat>,
    session: ClientSession | null = null,
  ): Promise<Chat | null> {
    const updated = await this.chatModel
      .findOneAndUpdate({ _id: id, userId }, update, { new: true, session })
      .lean()

    return updated ? ChatMapper.toEntity(updated) : null
  }

  async deleteById(id: string, userId: string): Promise<void> {
    await this.chatModel.deleteOne({ _id: id, userId })
  }

  async count(query: Record<string, any>): Promise<number> {
    return this.chatModel.countDocuments(query).exec()
  }

  async findMany(
    query: Record<string, any>,
    projection?: Projection<Chat>,
    options?: QueryOptions,
  ): Promise<Chat[]> {
    const chats = await this.chatModel.find(query, projection, options).lean()

    return chats.map(ChatMapper.toEntity)
  }

  async bulkWrite(operations: any[], session?: ClientSession): Promise<any> {
    return this.chatModel.bulkWrite(operations, { session })
  }

  async aggregate(pipeline: any[]) {
    return this.chatModel.aggregate(pipeline).exec()
  }
}

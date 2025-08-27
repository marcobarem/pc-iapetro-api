import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, ClientSession, QueryOptions } from 'mongoose'

import { Message } from '@core/entities'
import { MessageRepository } from '@domain/intec/repositories/message.repository'

import { MessageMapper } from '@infra/database/mongodb/mappers/message.mapper'
import { MessageDocument } from '@infra/database/mongodb/schemas/message.schema'
import { Projection } from '@core/@types'

@Injectable()
export class MongoMessageRepository implements MessageRepository {
  constructor(
    @InjectModel('Message')
    private readonly messageModel: Model<MessageDocument>,
  ) {}

  async create(
    createMessageDto: Omit<Message, '_id' | 'createdAt' | 'updatedAt'>,
    session: ClientSession | null = null,
  ): Promise<Message> {
    const mod = MessageMapper.toSchema(createMessageDto)

    const createdMessage = new this.messageModel(mod)

    const savedMessage = await createdMessage.save({ session })

    return MessageMapper.toEntity(savedMessage)
  }

  async findByChatId(
    chatId: string,
    projection?: Projection<Message>,
    options?: QueryOptions,
  ): Promise<Message[]> {
    const messages = await this.messageModel
      .find({ chatId }, projection, options)
      .lean()

    return messages.map(MessageMapper.toEntity)
  }

  async findByUserId(
    userId: string,
    projection?: Projection<Message>,
    options?: QueryOptions,
  ): Promise<Message[]> {
    const messages = await this.messageModel
      .find({ userId }, projection, options)
      .lean()

    return messages.map(MessageMapper.toEntity)
  }

  async findMany(
    query: Record<string, any>,
    projection?: Projection<Message>,
    options?: QueryOptions,
  ): Promise<Message[]> {
    const messages = await this.messageModel
      .find(query, projection, options)
      .lean()

    return messages.map(MessageMapper.toEntity)
  }

  async findById(
    id: string,
    projection?: Projection<Message>,
    options?: QueryOptions,
  ): Promise<Message | null> {
    const message = await this.messageModel
      .findById(id, projection, options)
      .lean()

    return message ? MessageMapper.toEntity(message) : null
  }

  async count(query: Record<string, any>): Promise<number> {
    return this.messageModel.countDocuments(query).exec()
  }

  async bulkWrite(operations: any[], session?: ClientSession): Promise<any> {
    return this.messageModel.bulkWrite(operations, { session })
  }

  async aggregate(pipeline: any[]) {
    return this.messageModel.aggregate(pipeline).exec()
  }
}

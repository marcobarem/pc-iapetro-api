import { MessageRepository } from '@domain/intec/repositories'
import { Injectable } from '@nestjs/common'
import { Types } from 'mongoose'

@Injectable()
export class GetMessagesByChatIdUseCase {
  constructor(private readonly messageRepository: MessageRepository) {}

  async execute(chatId: string, userId: string) {
    const messages = await this.messageRepository.findMany(
      {
        chatId: new Types.ObjectId(chatId),
        userId: new Types.ObjectId(userId),
      },
      {},
      {
        createdAt: -1,
      },
    )

    return messages
  }
}

import { ChatRepository } from '@domain/intec/repositories'
import { Injectable } from '@nestjs/common'

@Injectable()
export class GetChatsUseCase {
  constructor(private readonly chatRepository: ChatRepository) {}

  async execute(userId: string) {
    const chats = await this.chatRepository.findAllByUser(userId)

    return chats
  }
}

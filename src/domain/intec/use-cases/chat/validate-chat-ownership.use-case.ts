import { Injectable } from '@nestjs/common'
import { ForbiddenException } from '@nestjs/common'
import { IsUUID, IsNotEmpty, IsString } from 'class-validator'

import { ChatRepository } from '@domain/intec/repositories'

export class ValidateChatOwnershipInput {
  @IsString()
  @IsNotEmpty()
  chatId: string

  @IsString()
  @IsNotEmpty()
  userId: string
}

@Injectable()
export class ValidateChatOwnershipUseCase {
  constructor(private readonly chatRepository: ChatRepository) {}

  async execute({ chatId, userId }: ValidateChatOwnershipInput): Promise<void> {
    const chat = await this.chatRepository.findById(chatId, userId)

    if (!chat) {
      throw new ForbiddenException('Você não tem acesso a esse chat')
    }
  }
}

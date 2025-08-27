import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Request } from 'express'

import { ValidateChatOwnershipUseCase } from '@domain/intec/use-cases/chat'

@Injectable()
export class ChatOwnershipGuard implements CanActivate {
  constructor(
    private readonly validateChatOwnership: ValidateChatOwnershipUseCase,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>()
    const user = request.user as { sub: string }
    const chatId = request.params.chatId ?? request.body.chatId

    if (!chatId) {
      return true
    }

    await this.validateChatOwnership.execute({
      chatId,
      userId: user.sub,
    })

    return true
  }
}

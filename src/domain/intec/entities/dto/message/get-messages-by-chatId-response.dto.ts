import { ApiProperty } from '@nestjs/swagger'

import { MessageDto } from './message.dto'

export class GetMessagesByChatIdOutput {
  @ApiProperty({ type: [MessageDto] })
  messages: MessageDto[]
}

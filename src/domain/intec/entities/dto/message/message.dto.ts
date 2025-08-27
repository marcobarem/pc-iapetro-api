import { ApiProperty } from '@nestjs/swagger'

export class MessageDto {
  @ApiProperty()
  messageId: string

  @ApiProperty()
  chatId: string

  @ApiProperty()
  userId: string

  @ApiProperty()
  content: string

  @ApiProperty({ enum: ['user', 'ia'] })
  role: 'user' | 'ia'

  @ApiProperty()
  createdAt: Date
}

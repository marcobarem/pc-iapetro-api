import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator'

export class SendMessageInput {
  @ApiProperty({ description: 'ID do chat existente' })
  @IsOptional()
  @IsString()
  chatId?: string

  @ApiProperty({ description: 'Conteúdo da mensagem' })
  @IsString()
  @IsNotEmpty()
  content: string
}

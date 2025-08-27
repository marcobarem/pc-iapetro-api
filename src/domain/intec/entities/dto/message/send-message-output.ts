import { ApiProperty } from '@nestjs/swagger'
import { IsEnum, IsMongoId, IsNotEmpty, IsString } from 'class-validator'

export class SendMessageOutput {
  @ApiProperty({ description: 'ID do chat existente' })
  @IsString()
  @IsNotEmpty()
  _id: string

  @ApiProperty({ description: 'ID do chat existente' })
  @IsNotEmpty()
  @IsString()
  chatId: string

  @ApiProperty({ description: 'ID do usuário que envia a mensagem' })
  @IsString()
  @IsNotEmpty()
  userId: string

  @ApiProperty({ description: 'Conteúdo da mensagem' })
  @IsString()
  @IsNotEmpty()
  content: string

  @ApiProperty({ enum: ['user', 'ia'], description: 'Papel do remetente' })
  role: 'ia'

  @ApiProperty({
    description: 'Data de criação da mensagem',
    type: Date,
  })
  createdAt: Date
}

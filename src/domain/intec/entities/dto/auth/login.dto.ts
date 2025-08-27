import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsNotEmpty, IsString } from 'class-validator'

export class LoginUserDto {
  @ApiProperty({ example: 'joao.silva@email.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string

  @ApiProperty({ example: 'Senha123!' })
  @IsString()
  @IsNotEmpty()
  password: string
}

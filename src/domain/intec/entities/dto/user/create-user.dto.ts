import { IsCPF } from '@core/decorators/validators'
import { ApiProperty } from '@nestjs/swagger'
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator'

export class CreateUserDto {
  @ApiProperty({
    example: 'João Silva',
    description: 'Nome completo do usuário',
  })
  @IsString()
  @IsNotEmpty()
  name: string

  @ApiProperty({
    example: 'joao.silva@email.com',
    description: 'Endereço de e-mail válido',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string

  @ApiProperty({
    example: 'Senha123!',
    description:
      'Senha com pelo menos 6 caracteres, incluindo números e letras',
  })
  @IsString()
  @IsNotEmpty()
  @Length(6, 20)
  password: string

  @ApiProperty({
    example: '123.456.789-00',
    description: 'CPF válido no formato XXX.XXX.XXX-XX',
  })
  @IsString()
  // @IsCPF()
  @IsNotEmpty()
  cpf: string

  @ApiProperty({
    example: '+55 11 91234-5678',
    description: 'Número de telefone com DDI e DDD, sem parênteses',
    required: false,
  })
  @IsString()
  @IsOptional()
  @Matches(/^\+\d{2}\s\d{2}\s\d{4,5}-\d{4}$/, {
    message: 'Número de telefone inválido. Exemplo válido: +55 11 91234-5678',
  })
  phone?: string
}

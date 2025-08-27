import { Controller, Post, Body } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger'

import { LoginUserDto } from '@domain/intec/entities/dto/auth'
import { CreateUserDto } from '@domain/intec/entities/dto/user'

import {
  CreateUserUseCase,
  LoginUserUseCase,
} from '@domain/intec/use-cases/user'
import { IsPublic } from '@core/decorators/is-public.decorator'

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly loginUserUseCase: LoginUserUseCase,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Cadastrar um novo usuário' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({
    status: 201,
    description: 'Usuário cadastrado com sucesso',
    schema: {
      example: {
        statusCode: 201,
        data: {
          id: '661e9a4f7f90d1a23c8a3fcd',
          email: 'user@example.com',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Erro de validação ou usuário já existente',
  })
  @IsPublic()
  async register(@Body() createUserDto: CreateUserDto) {
    return await this.createUserUseCase.execute(createUserDto)
  }

  @Post('login')
  @ApiOperation({ summary: 'Autenticar usuário e gerar token' })
  @ApiBody({ type: LoginUserDto })
  @ApiResponse({
    status: 200,
    description: 'Login realizado com sucesso',
    schema: {
      example: {
        statusCode: 200,
        data: {
          access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciais inválidas',
  })
  @IsPublic()
  async login(@Body() loginUserDto: LoginUserDto) {
    const accessToken = await this.loginUserUseCase.execute(loginUserDto)

    return {
      access_token: accessToken,
    }
  }
}

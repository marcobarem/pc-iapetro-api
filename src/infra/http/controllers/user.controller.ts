import { Controller, Get } from '@nestjs/common'
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger'

import { GetUserUseCase } from '@domain/intec/use-cases/user'
import { UserData } from '@core/decorators/user.decorator'
import { UserPayload } from '@infra/auth/jwt-strategy'

@Controller('users')
@ApiTags('Users')
@ApiBearerAuth()
export class UserController {
  constructor(private readonly getUserUseCase: GetUserUseCase) {}

  @Get('me')
  @ApiOperation({
    summary: 'Buscar usuário',
  })
  @ApiResponse({
    status: 200,
    description: 'Usuário encontrado',
    schema: {
      example: {
        statusCode: 200,
        data: {
          _id: '661111111111111111111111',
          email: 'user@example.com',
          name: 'user',
        },
      },
    },
  })
  async getUser(@UserData() { sub: userId }: UserPayload) {
    return await this.getUserUseCase.execute(userId)
  }
}

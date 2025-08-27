import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'

import { UserRepository } from '@domain/intec/repositories'
import { HashComparer } from '@domain/intec/cryptography'
import { LoginUserDto } from '@domain/intec/entities/dto/auth'

@Injectable()
export class LoginUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly hashComparer: HashComparer,
    private readonly jwtService: JwtService,
  ) {}

  async execute(loginUserDto: LoginUserDto): Promise<string> {
    const { email, password } = loginUserDto

    const user = await this.userRepository.findByEmail(email)

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas')
    }

    const passwordValid = await this.hashComparer.compare(
      password,
      user.password,
    )
    if (!passwordValid) {
      throw new UnauthorizedException('Credenciais inválidas')
    }

    const payload = { sub: user._id }
    const accessToken = await this.jwtService.signAsync(payload)

    return accessToken
  }
}

import { ConflictException, Injectable } from '@nestjs/common'

import { CreateUserDto } from '@domain/intec/entities/dto/user'
import { User } from '@core/entities'

import { HashGenerator } from '@domain/intec/cryptography'
import { UserRepository } from '@domain/intec/repositories'

@Injectable()
export class CreateUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly hashGenerator: HashGenerator,
  ) {}

  async execute(
    data: CreateUserDto,
  ): Promise<{ user: Omit<User, 'password'> }> {
    const [cpfAlreadyExists, emailAlreadyExists] = await Promise.all([
      this.userRepository.findByCPF(data.cpf),
      this.userRepository.findByEmail(data.email),
    ])

    if (cpfAlreadyExists || emailAlreadyExists) {
      throw new ConflictException(`Usuário já cadastrado!`)
    }

    const hashedPassword = await this.hashGenerator.hash(data.password)

    const user = await this.userRepository.create({
      ...data,
      password: hashedPassword,
    })

    const { password, ...userData } = user

    return { user: userData }
  }
}

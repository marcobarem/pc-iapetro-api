import { UserRepository } from '@domain/intec/repositories/user.repository'
import { Injectable } from '@nestjs/common'

@Injectable()
export class GetUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(
    id: string,
  ): Promise<{ id: string; email: string; name: string } | null> {
    const user = await this.userRepository.findById(id)

    if (!user) {
      return null
    }

    return { id: user._id, email: user.email, name: user.name }
  }
}

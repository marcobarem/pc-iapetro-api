import { CreateUserDto } from '@domain/intec/entities/dto/user'
import { User } from '@core/entities'
import { ClientSession } from 'mongoose'

export abstract class UserRepository {
  abstract create(user: CreateUserDto, session?: ClientSession): Promise<User>
  abstract findById(id: string): Promise<User | null>
  abstract findByEmail(email: string): Promise<User | null>
  abstract findByCPF(cpf: string): Promise<User | null>
}

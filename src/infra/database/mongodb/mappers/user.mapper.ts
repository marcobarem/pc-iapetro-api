import { UserDocument } from '../schemas/user.schema'
import { User } from '@core/entities/user.entity'

export class UserMapper {
  static toEntity(document: UserDocument): User {
    return new User(
      document._id?.toString() || '',
      document.name,
      document.email,
      document.password,
      document.cpf,
      document.phone || '',
      document.createdAt,
      document.updatedAt,
    )
  }

  static toSchema(entity: Omit<User, '_id' | 'createdAt' | 'updatedAt'>) {
    return {
      name: entity.name,
      email: entity.email,
      password: entity.password,
      cpf: entity.cpf,
      phone: entity.phone,
    }
  }
}

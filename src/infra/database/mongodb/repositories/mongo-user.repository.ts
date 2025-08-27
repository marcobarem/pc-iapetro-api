import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, ClientSession } from 'mongoose'
import { UserRepository } from '@domain/intec/repositories/user.repository'
import { User } from '@core/entities/user.entity'
import { UserMapper } from '../mappers/user.mapper'
import { UserDocument } from '../schemas/user.schema'

@Injectable()
export class MongoUserRepository implements UserRepository {
  constructor(
    @InjectModel('User')
    private readonly userModel: Model<UserDocument>,
  ) {}

  async create(
    userData: Omit<User, '_id' | 'createdAt' | 'updatedAt'>,
    session: ClientSession | null = null,
  ): Promise<User> {
    const createdUser = new this.userModel(UserMapper.toSchema(userData))
    const savedUser = await createdUser.save({ session })

    return UserMapper.toEntity(savedUser)
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.userModel.findOne({ email }).lean()

    return user ? UserMapper.toEntity(user) : null
  }

  async findByCPF(cpf: string): Promise<User | null> {
    const user = await this.userModel.findOne({ cpf }).lean()

    return user ? UserMapper.toEntity(user) : null
  }

  async findById(_id: string): Promise<User | null> {
    const user = await this.userModel.findOne({ _id }).lean()

    return user ? UserMapper.toEntity(user) : null
  }
}

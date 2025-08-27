import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Schema as MongooseSchema } from 'mongoose'

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, type: MongooseSchema.Types.String, trim: true })
  name: string

  @Prop({
    required: true,
    type: MongooseSchema.Types.String,
    unique: true,
    trim: true,
  })
  email: string

  @Prop({ required: true, type: MongooseSchema.Types.String, trim: true })
  password: string

  @Prop({
    required: true,
    type: MongooseSchema.Types.String,
    unique: true,
    trim: true,
  })
  cpf: string

  @Prop({ type: MongooseSchema.Types.String, trim: true })
  phone?: string
}

export const UserSchema = SchemaFactory.createForClass(User)

export type UserDocument = Document &
  User & {
    createdAt: Date
    updatedAt: Date
  }

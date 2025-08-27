import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Schema as MongooseSchema } from 'mongoose'

@Schema({ timestamps: true })
export class Chat {
  @Prop({
    required: true,
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
  })
  userId: string

  @Prop({
    type: MongooseSchema.Types.String,
    trim: true,
    default: 'Untitled Chat',
  })
  title: string
}

export const ChatSchema = SchemaFactory.createForClass(Chat)

ChatSchema.index({ createdAt: 1 })
ChatSchema.index({ updatedAt: 1 })
ChatSchema.index({ userId: 1 })
ChatSchema.index({ userId: 1, updatedAt: -1 })

export type ChatDocument = Document &
  Chat & {
    createdAt: Date
    updatedAt: Date
  }

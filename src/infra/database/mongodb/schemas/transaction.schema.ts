import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Schema as MongooseSchema } from 'mongoose'

@Schema({ timestamps: true })
export class Transaction {
  @Prop({ required: true, type: MongooseSchema.Types.Date })
  supplyDate: Date

  @Prop({ required: true, type: MongooseSchema.Types.String })
  supplyTime: string // Corresponde a 'Hora Abast.'

  @Prop({ type: MongooseSchema.Types.Date })
  fiscalDate?: Date // Corresponde a 'Data Fiscal'

  @Prop({ type: MongooseSchema.Types.String })
  fiscalTime?: string // Corresponde a 'Hora Fiscal'

  @Prop({ type: MongooseSchema.Types.String })
  supplyVsSale?: string // Corresponde a 'Abast. x Venda'

  @Prop({ type: MongooseSchema.Types.String })
  nozzle: string // Corresponde a 'Bico'

  @Prop({
    required: true,
    type: MongooseSchema.Types.String,
    trim: true,
  })
  coupon: string // Corresponde a 'Cupom', assumindo que é um identificador único de cupom

  @Prop({ required: true, type: MongooseSchema.Types.String, trim: true })
  employeeName: string // Corresponde a 'Funcionario'

  @Prop({ required: true, type: MongooseSchema.Types.String, trim: true })
  product: string // Corresponde a 'Produto' (ex: "Gasolina Comum", "Etanol")

  @Prop({ required: true, type: MongooseSchema.Types.Number })
  quantity: number // Corresponde a 'Quantidade' (ex: litros)

  @Prop({ required: true, type: MongooseSchema.Types.Number })
  unitPrice: number // Corresponde a 'Preço Unitario'

  @Prop({ required: true, type: MongooseSchema.Types.Number })
  value: number // Corresponde a 'Valor' (valor total da venda)

  @Prop({ type: MongooseSchema.Types.Number })
  initialCounter?: number // Corresponde a 'Encerrante Ini.'

  @Prop({ type: MongooseSchema.Types.Number })
  finalCounter?: number // Corresponde a 'Encerrante Fim'

  @Prop({ type: MongooseSchema.Types.Boolean }) // Assumindo que 'Aferição' seja um indicador booleano
  calibration?: boolean // Corresponde a 'Aferição'

  @Prop({ type: MongooseSchema.Types.Date })
  movementDate?: Date // Corresponde a 'Data Movimento'

  @Prop({ type: MongooseSchema.Types.Number })
  priceA?: number // Corresponde a 'Preço A'

  @Prop({ type: MongooseSchema.Types.Number })
  priceB?: number // Corresponde a 'Preço B'

  @Prop({ type: MongooseSchema.Types.Number })
  priceC?: number // Corresponde a 'Preço C'

  @Prop({ type: MongooseSchema.Types.String })
  record?: string // Corresponde a 'Registro'

  @Prop({ type: MongooseSchema.Types.String })
  substitution?: string // Corresponde a 'Substituição'
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction)

export type TransactionDocument = Document &
  Transaction & {
    createdAt: Date
    updatedAt: Date
  }

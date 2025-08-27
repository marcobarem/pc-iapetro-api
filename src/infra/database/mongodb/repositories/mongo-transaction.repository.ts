import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { ClientSession, Model } from 'mongoose'

import { TransactionRepository } from '@domain/intec/repositories'
import { TransactionDocument } from '@infra/database/mongodb/schemas'

@Injectable()
export class MongoTransactionRepository implements TransactionRepository {
  constructor(
    @InjectModel('Transaction')
    private readonly transactionModel: Model<TransactionDocument>,
  ) {}

  async aggregate(pipeline: any[]): Promise<any[]> {
    return this.transactionModel.aggregate(pipeline).exec()
  }

  async bulkWrite(
    operations: any[],
    session?: ClientSession | undefined,
  ): Promise<any> {
    return this.transactionModel.bulkWrite(operations, { session })
  }
}

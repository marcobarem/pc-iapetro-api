import { ClientSession } from 'mongoose'

export abstract class TransactionRepository {
  abstract aggregate(pipeline: any[]): Promise<any>
  abstract bulkWrite(operations: any[], session?: ClientSession): Promise<any>
}

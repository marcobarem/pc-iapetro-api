import { Module } from '@nestjs/common'

import { MongoDbModule } from './mongodb/mongodb.module'

@Module({
  imports: [MongoDbModule],
  providers: [],
  exports: [MongoDbModule],
})
export class DatabaseModule {}

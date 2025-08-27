import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { HttpModule } from '@infra/http/http.module'
import { EnvModule } from './infra/env'
import { AuthModule } from '@infra/auth/auth.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    EnvModule,
    AuthModule,
    HttpModule,
  ],
})
export class AppModule {}

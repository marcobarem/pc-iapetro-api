import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { JwtModule, JwtService } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { EnvModule } from '../env/env.module'
import { EnvService } from '../env/env.service'
import { JwtAuthGuard } from './jwt-auth.guard'
import { JwtStrategy } from './jwt-strategy'

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [EnvModule],
      inject: [EnvService],
      global: true,
      useFactory(env: EnvService) {
        return {
          signOptions: {
            algorithm: 'RS256',
            expiresIn: env.get('JWT_EXPIRES_IN'),
          },
          privateKey: env.get('JWT_PRIVATE_KEY').replace(/\\n/g, '\n'),
          publicKey: env.get('JWT_PUBLIC_KEY').replace(/\\n/g, '\n'),
        }
      },
    }),
  ],
  providers: [
    JwtService,
    JwtStrategy,
    EnvService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AuthModule {}

import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { IsMongoId, IsString, validateSync } from 'class-validator'

import { EnvService } from '../env/env.service'

export class UserPayload {
  @IsString()
  sub: string
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(env: EnvService) {
    const publicKey = env.get('JWT_PUBLIC_KEY')

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: publicKey,
      algorithms: ['RS256'],
    })
  }

  async validate(payload: any): Promise<UserPayload> {
    const userPayload = Object.assign(new UserPayload(), payload)

    const errors = validateSync(userPayload)

    if (errors.length > 0) {
      throw new UnauthorizedException('Acesso negado!')
    }

    return userPayload
  }
}

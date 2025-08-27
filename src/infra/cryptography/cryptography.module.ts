import { Module } from '@nestjs/common'

import { BcryptHasher } from './bcrypt-hasher.service'
import { JwtEncrypter } from './jwt-encrypter.service'
import {
  Encrypter,
  HashComparer,
  HashGenerator,
} from '@domain/intec/cryptography'

@Module({
  providers: [
    { provide: Encrypter, useClass: JwtEncrypter },
    { provide: HashComparer, useClass: BcryptHasher },
    { provide: HashGenerator, useClass: BcryptHasher },
  ],
  exports: [Encrypter, HashComparer, HashGenerator],
})
export class CryptographyModule {}

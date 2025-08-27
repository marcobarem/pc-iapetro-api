import { Module } from '@nestjs/common'

import { EnvModule } from '@infra/env'

import { OpenAiService } from './open-ai.service'

@Module({
  imports: [EnvModule],
  providers: [OpenAiService],
  exports: [OpenAiService],
})
export class OpenAiModule {}

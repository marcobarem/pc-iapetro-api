import { plainToInstance } from 'class-transformer'
import { IsNotEmpty, IsNumber, IsString, validateSync } from 'class-validator'

export class Env {
  @IsString()
  @IsNotEmpty()
  DATABASE_URL: string

  @IsString()
  @IsNotEmpty()
  DATABASE_NAME: string

  @IsNumber()
  @IsNotEmpty()
  apiPort: number

  @IsString()
  @IsNotEmpty()
  JWT_PUBLIC_KEY: string

  @IsString()
  @IsNotEmpty()
  JWT_PRIVATE_KEY: string

  @IsString()
  @IsNotEmpty()
  JWT_EXPIRES_IN: string

  @IsString()
  @IsNotEmpty()
  AZURE_OPENAI_ENDPOINT: string

  @IsString()
  @IsNotEmpty()
  AZURE_OPENAI_API_KEY: string

  @IsString()
  @IsNotEmpty()
  AZURE_OPENAI_DEPLOYMENT: string
}

export const env: Env = plainToInstance(Env, {
  DATABASE_URL: process.env.DATABASE_URL,
  DATABASE_NAME: process.env.DATABASE_NAME,
  apiPort: Number(process.env.API_PORT),
  JWT_PUBLIC_KEY: process.env.JWT_PUBLIC_KEY,
  JWT_PRIVATE_KEY: process.env.JWT_PRIVATE_KEY,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
  AZURE_OPENAI_ENDPOINT: process.env.AZURE_OPENAI_ENDPOINT,
  AZURE_OPENAI_API_KEY: process.env.AZURE_OPENAI_API_KEY,
  AZURE_OPENAI_DEPLOYMENT: process.env.AZURE_OPENAI_DEPLOYMENT,
})

const errors = validateSync(env)

if (errors.length > 0) {
  throw new Error(JSON.stringify(errors, null, 2))
}

import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common'
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger'
import { FileInterceptor } from '@nestjs/platform-express'
import { ImportTransactionsUseCase } from '@domain/intec/use-cases/transaction/upload-transactions.use-case'

@Controller('transactions')
@ApiTags('Transactions')
@ApiBearerAuth()
export class TransactionsController {
  constructor(
    private readonly importTransactionsUseCase: ImportTransactionsUseCase,
  ) {}

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Upload de Transações de Posto via Excel',
    description:
      'Faz o upload de um arquivo Excel contendo dados de transações de postos de combustível.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description:
            'Arquivo Excel (.xlsx) contendo as transações a serem importadas',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Transações importadas com sucesso',
    schema: {
      example: {
        statusCode: 201,
        data: {
          importedCount: 100,
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Requisição inválida (arquivo não enviado ou erro no processamento do arquivo).',
    schema: {
      example: {
        timestamp: '2025-06-04T18:00:00.000Z',
        path: '/transactions/import',
        method: 'POST',
        statusCode: 400,
        error: {
          message: 'O arquivo é obrigatório',
        },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Erro interno no servidor',
    schema: {
      example: {
        timestamp: '2025-06-04T18:00:00.000Z',
        path: '/transactions/import',
        method: 'POST',
        statusCode: 500,
        error: {
          message: 'Erro desconhecido ao processar o arquivo.',
        },
      },
    },
  })
  async importTransactions(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('O arquivo é obrigatório.')
    }

    const result = await this.importTransactionsUseCase.execute(file.buffer)

    return { importedCount: result.importedCount }
  }
}

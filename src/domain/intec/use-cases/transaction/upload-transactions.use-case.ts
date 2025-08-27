import { Injectable, Logger, BadRequestException } from '@nestjs/common'
import { InjectConnection } from '@nestjs/mongoose'
import { Connection } from 'mongoose'
import * as ExcelJS from 'exceljs'
import { parse } from 'date-fns'

import { TransactionRepository } from '@domain/intec/repositories/transaction.repository'
import { Transaction } from 'src/core/entities/transaction.entity'

const COLUMN_INDICES = {
  'Data Abast.': 1,
  'Hora Abast.': 2,
  'Data Fiscal': 3,
  'Hora Fiscal': 4,
  'Abast. x Venda': 5,
  Bico: 6,
  coupon: 7,
  Funcionario: 8,
  Produto: 9,
  Quantidade: 10,
  'Preço Unitario': 11,
  Valor: 12,
  'Encerrante Ini.': 13,
  'Encerrante Fim': 14,
  Aferição: 15,
  'Data Movimento': 16,
  'Preço A': 17,
  'Preço B': 18,
  'Preço C': 19,
  Registro: 20,
  Substituição: 21,
}

@Injectable()
export class ImportTransactionsUseCase {
  private readonly logger = new Logger(ImportTransactionsUseCase.name)

  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly transactionRepository: TransactionRepository,
  ) {}

  private _extractRawDataFromRow(row: ExcelJS.Row): {
    [key: string]: ExcelJS.CellValue | undefined
  } {
    const rawData: { [key: string]: ExcelJS.CellValue | undefined } = {}
    for (const key in COLUMN_INDICES) {
      if (COLUMN_INDICES.hasOwnProperty(key)) {
        rawData[key] = row.getCell(
          COLUMN_INDICES[key as keyof typeof COLUMN_INDICES],
        ).value
      }
    }
    return rawData
  }

  private _cleanAndParseNumber(
    value: ExcelJS.CellValue | undefined,
  ): number | undefined {
    if (value === undefined || value === null) return undefined
    let valueStr = String(value)
    valueStr = valueStr.replace('R$', '').replace(/\./g, '').replace(',', '.')
    const num = parseFloat(valueStr)
    return isNaN(num) ? undefined : num
  }

  private _parseDateAndTimeToUTC(
    dateCell: ExcelJS.CellValue | undefined,
    timeCell: ExcelJS.CellValue | undefined,
  ): Date | undefined {
    if (!dateCell) return undefined

    let parsedDate: Date
    if (dateCell instanceof Date) {
      parsedDate = dateCell
    } else {
      parsedDate = parse(String(dateCell), 'dd/MM/yyyy', new Date())
    }

    if (isNaN(parsedDate.getTime())) {
      return undefined
    }

    if (timeCell) {
      const timeStr = String(timeCell)
      const timeParts = timeStr.split(':')
      const hours = parseInt(timeParts[0], 10)
      const minutes = parseInt(timeParts[1], 10)
      const seconds = timeParts.length > 2 ? parseInt(timeParts[2], 10) : 0

      if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) {
        this.logger.warn(
          `Hora inválida encontrada: "${timeStr}" para data "${dateCell}"`,
        )
        return new Date(
          Date.UTC(
            parsedDate.getFullYear(),
            parsedDate.getMonth(),
            parsedDate.getDate(),
          ),
        )
      }

      return new Date(
        Date.UTC(
          parsedDate.getFullYear(),
          parsedDate.getMonth(),
          parsedDate.getDate(),
          hours,
          minutes,
          seconds,
        ),
      )
    } else {
      return new Date(
        Date.UTC(
          parsedDate.getFullYear(),
          parsedDate.getMonth(),
          parsedDate.getDate(),
        ),
      )
    }
  }

  /**
   * Converte os dados brutos extraídos da linha do Excel para uma instância da entidade Transaction.
   * Atribui 'N/A' para strings vazias/nulas de campos opcionais.
   * @param rawData Um objeto contendo os valores brutos da linha do Excel.
   * @returns Uma instância de Transaction.
   */
  private _createTransactionEntity(rawData: {
    [key: string]: ExcelJS.CellValue | undefined
  }): Transaction {
    const supplyDate = this._parseDateAndTimeToUTC(
      rawData['Data Abast.'],
      rawData['Hora Abast.'],
    )
    const horaAbast = String(rawData['Hora Abast.'] || 'N/A').trim()
    const fiscalDate = this._parseDateAndTimeToUTC(
      rawData['Data Fiscal'],
      rawData['Hora Fiscal'],
    )
    const horaFiscal = String(rawData['Hora Fiscal'] || 'N/A').trim()
    const abastXVenda = String(rawData['Abast. x Venda'] || 'N/A').trim()
    const bico = String(rawData['Bico'] || 'N/A').trim()
    const coupon = String(rawData['coupon'] || 'N/A').trim()
    const funcionario = String(rawData['Funcionario'] || 'N/A').trim()
    const produto = String(rawData['Produto'] || 'N/A').trim()
    const quantidade = this._cleanAndParseNumber(rawData['Quantidade'])
    const precoUnitario = this._cleanAndParseNumber(rawData['Preço Unitario'])
    const valor = this._cleanAndParseNumber(rawData['Valor'])
    const encerranteIni = this._cleanAndParseNumber(rawData['Encerrante Ini.'])
    const encerranteFim = this._cleanAndParseNumber(rawData['Encerrante Fim'])
    const afericao = String(rawData['Aferição'] || 'N/A').trim()
    const movementDate = this._parseDateAndTimeToUTC(
      rawData['Data Movimento'],
      undefined,
    )
    const precoA = this._cleanAndParseNumber(rawData['Preço A'])
    const precoB = this._cleanAndParseNumber(rawData['Preço B'])
    const precoC = this._cleanAndParseNumber(rawData['Preço C'])
    const registro = String(rawData['Registro'] || 'N/A').trim()
    const substituicao = String(rawData['Substituição'] || 'N/A').trim()

    const calibration =
      afericao.toUpperCase() === 'SIM'
        ? true
        : afericao.toUpperCase() === 'NÃO'
          ? false
          : undefined

    return new Transaction(
      supplyDate!,
      horaAbast,
      funcionario,
      produto,
      quantidade!,
      precoUnitario!,
      valor!,
      coupon,
      undefined,
      fiscalDate,
      horaFiscal,
      abastXVenda,
      bico,
      encerranteIni,
      encerranteFim,
      calibration,
      movementDate,
      precoA,
      precoB,
      precoC,
      registro,
      substituicao,
    )
  }

  /**
   * Valida se uma transação possui todos os dados essenciais e numéricos válidos.
   * @param transaction A instância de Transaction a ser validada.
   * @param rawData Os dados brutos da linha para logs de erro.
   * @param rowNumber O número da linha para logs de erro.
   * @throws Error se a transação for inválida.
   */
  private _validateTransaction(
    transaction: Transaction,
    rawData: any,
    rowNumber: number,
  ): void {
    const errors: string[] = []

    if (!transaction.supplyDate)
      errors.push('Data de abastecimento inválida ou ausente')
    if (rawData['Data Fiscal'] && !transaction.fiscalDate)
      errors.push(`Data fiscal inválida: "${rawData['Data Fiscal']}"`)
    if (rawData['Data Movimento'] && !transaction.movementDate)
      errors.push(`Data de movimento inválida: "${rawData['Data Movimento']}"`)

    if (!transaction.coupon || transaction.coupon === 'N/A')
      errors.push('coupon ausente')
    if (!transaction.employeeName || transaction.employeeName === 'N/A')
      errors.push('Nome do funcionário ausente')
    if (!transaction.product || transaction.product === 'N/A')
      errors.push('Produto ausente')

    if (transaction.quantity === undefined || isNaN(transaction.quantity))
      errors.push('Quantidade inválida ou ausente')
    if (transaction.unitPrice === undefined || isNaN(transaction.unitPrice))
      errors.push('Preço unitário inválido ou ausente')
    if (transaction.value === undefined || isNaN(transaction.value))
      errors.push('Valor de venda inválido ou ausente')

    if (
      transaction.initialCounter !== undefined &&
      isNaN(transaction.initialCounter)
    )
      errors.push('Encerrante Inicial inválido')
    if (
      transaction.finalCounter !== undefined &&
      isNaN(transaction.finalCounter)
    )
      errors.push('Encerrante Final inválido')
    if (transaction.priceA !== undefined && isNaN(transaction.priceA))
      errors.push('Preço A inválido')
    if (transaction.priceB !== undefined && isNaN(transaction.priceB))
      errors.push('Preço B inválido')
    if (transaction.priceC !== undefined && isNaN(transaction.priceC))
      errors.push('Preço C inválido')

    if (errors.length > 0) {
      this.logger.warn(
        `Linha ${rowNumber}: Erros de validação: ${errors.join(', ')}. Dados: ${JSON.stringify(rawData)}`,
      )
      throw new Error(`Dados inválidos: ${errors.join(', ')}`)
    }

    this.logger.debug(
      `Linha ${rowNumber}: Dados processados e validados com sucesso.`,
    )
  }

  async execute(fileBuffer: Buffer): Promise<{
    importedCount: number
    errors?: { line: number; error: string; data?: any }[]
  }> {
    const session = await this.connection.startSession()
    session.startTransaction()

    const bulkOperations: any[] = []
    const importErrors: { line: number; error: string; data?: any }[] = []

    this.logger.log(
      'Iniciando o processo de importação de transações via Excel.',
    )

    try {
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.load(fileBuffer)
      const worksheet = workbook.worksheets[0]

      this.logger.log(
        `Planilha carregada. Total de linhas: ${worksheet.rowCount}.`,
      )

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) {
          this.logger.debug('Pulando linha do cabeçalho.')
          return
        }

        const rawData = this._extractRawDataFromRow(row)
        this.logger.debug(
          `Processando linha ${rowNumber}. Dados brutos: ${JSON.stringify(rawData)}`,
        )

        try {
          const transaction = this._createTransactionEntity(rawData)

          this._validateTransaction(transaction, rawData, rowNumber)

          bulkOperations.push({
            insertOne: {
              document: transaction,
            },
          })
          this.logger.debug(
            `Linha ${rowNumber}: Transação preparada para inserção.`,
          )
        } catch (error: any) {
          this.logger.error(
            `Linha ${rowNumber}: Falha ao processar. Erro: ${error.message}.`,
          )
          importErrors.push({
            line: rowNumber,
            error: error.message,
            data: rawData,
          })
        }
      })

      this.logger.log(
        `Processamento das linhas do Excel concluído. Registros válidos para bulk: ${bulkOperations.length}. Erros encontrados: ${importErrors.length}.`,
      )

      if (bulkOperations.length === 0) {
        if (importErrors.length > 0) {
          throw new BadRequestException(importErrors)
        } else {
          throw new BadRequestException(
            'Nenhuma transação válida encontrada para importação no arquivo.',
          )
        }
      }

      let insertedCount = 0
      try {
        const result = await this.transactionRepository.bulkWrite(
          bulkOperations,
          session,
        )
        insertedCount = result.insertedCount || 0
        this.logger.log(
          `Bulk write executado. Registros inseridos com sucesso: ${insertedCount}.`,
        )
      } catch (bulkWriteError: any) {
        this.logger.error('Erro na execução do bulk write:', bulkWriteError)
        importErrors.push({
          line: 0,
          error: `Erro na importação: ${bulkWriteError.message || 'Erro desconhecido'}`,
        })
        insertedCount = bulkWriteError.result?.insertedCount || 0
      }

      await session.commitTransaction()

      if (importErrors.length > 0) {
        throw new BadRequestException(importErrors)
      }

      this.logger.log('Processo de importação concluído com sucesso!')
      return { importedCount: insertedCount }
    } catch (error: any) {
      this.logger.error('Erro fatal durante a importação de transações:', error)
      await session.abortTransaction()
      throw new BadRequestException(
        importErrors.length > 0
          ? importErrors
          : [
              {
                line: 0,
                error:
                  error.message || 'Erro desconhecido ao processar o arquivo.',
              },
            ],
      )
    } finally {
      session.endSession()
      this.logger.log('Sessão do MongoDB finalizada.')
    }
  }
}

export interface RawTransactionImportData {
  'Data Abast.': string
  'Hora Abast.': string
  'Data Fiscal': string
  'Hora Fiscal': string
  'Abast. x Venda'?: string
  Bico?: string
  Cupom: string
  Funcionario: string
  Produto: string
  Quantidade: string
  'Preço Unitario': string
  Valor: string
  'Encerrante Ini.'?: string
  'Encerrante Fim'?: string
  Aferição?: string
  'Data Movimento'?: string
  'Preço A'?: string
  'Preço B'?: string
  'Preço C'?: string
  Registro?: string
  Substituição?: string
}

export type ImportTransactionsInput = RawTransactionImportData[]

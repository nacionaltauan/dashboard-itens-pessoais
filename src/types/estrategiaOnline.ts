export interface ResumoResponse {
  success: boolean
  data: {
    range: string
    majorDimension: string
    values: string[][]
    totalRows: number
    totalColumns: number
  }
}

export interface VeiculoData {
  veiculo: string
  mes: string
  custoInvestido: number
  custoPrevisto: number
  tipoCompra: string
}

export interface MonthlyData {
  mes: string
  totalInvestido: number
  totalPrevisto: number
  pacing: number
  veiculos: {
    [key: string]: {
      custoInvestido: number
      custoPrevisto: number
      tipoCompra: string
      pacing: number
    }
  }
}

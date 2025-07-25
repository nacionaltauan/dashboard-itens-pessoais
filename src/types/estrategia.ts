export interface VeiculoData {
  veiculo: string
  mes: string
  custoInvestido: number
  custoPrevisto: number
  tipoCompra: string
}

export interface MonthlyMetrics {
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

export interface EstrategiaResponse {
  success: boolean
  data: {
    values: string[][]
  }
}

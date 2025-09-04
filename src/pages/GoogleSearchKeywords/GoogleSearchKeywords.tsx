"use client"

import type React from "react"
import { useState, useMemo, useRef } from "react"
import { Calendar } from "lucide-react"
import Loading from "../../components/Loading/Loading" // Assumindo que o componente de Loading é reutilizável
import PDFDownloadButton from "../../components/PDFDownloadButton/PDFDownloadButton" // Componente de download de PDF

// Interface para definir a estrutura dos dados de cada palavra-chave
interface KeywordData {
  date: string
  keyword: string
  cost: number
  impressions: number
  clicks: number
  ctr: number
}

// --- Dados Estáticos (Hardcoded) ---
// Substituímos o carregamento da API por esta lista de dados.
// Podes alterar ou adicionar mais linhas conforme necessário.
const staticKeywordData: KeywordData[] = [
  { date: "2024-08-01", keyword: "uma mamadinha daquelas", cost: 150.75, impressions: 12000, clicks: 350, ctr: 2.92 },
  { date: "2024-08-01", keyword: "melhores ténis de corrida", cost: 220.50, impressions: 18500, clicks: 620, ctr: 3.35 },
  { date: "2024-08-02", keyword: "sapatilhas de couro", cost: 95.20, impressions: 8000, clicks: 180, ctr: 2.25 },
  { date: "2024-08-02", keyword: "sandálias de verão", cost: 180.00, impressions: 15000, clicks: 450, ctr: 3.00 },
  { date: "2024-08-03", keyword: "botas de inverno promoção", cost: 310.40, impressions: 25000, clicks: 890, ctr: 3.56 },
  { date: "2024-08-03", keyword: "calçado infantil barato", cost: 75.60, impressions: 9500, clicks: 210, ctr: 2.21 },
  { date: "2024-08-04", keyword: "loja de sapatos perto de mim", cost: 110.00, impressions: 11000, clicks: 310, ctr: 2.82 },
  { date: "2024-08-04", keyword: "sapatos de festa", cost: 190.80, impressions: 16000, clicks: 550, ctr: 3.44 },
  { date: "2024-08-05", keyword: "chinelos confortáveis", cost: 60.30, impressions: 7000, clicks: 150, ctr: 2.14 },
  { date: "2024-08-05", keyword: "ténis nike air max", cost: 450.00, impressions: 35000, clicks: 1500, ctr: 4.29 },
  // Adiciona mais dados aqui se precisares
]

const GoogleSearchKeywords: React.FC = () => {
  const contentRef = useRef<HTMLDivElement>(null)
  
  // Estado para os dados processados, inicializado com os dados estáticos
  const [processedData] = useState<KeywordData[]>(staticKeywordData)
  
  // Estado para o intervalo de datas do filtro
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: "2024-08-01", end: "2024-08-05" })
  
  // Estado para a paginação da tabela
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  // Memoização para filtrar os dados com base no período selecionado
  const filteredData = useMemo(() => {
    let filtered = processedData

    if (dateRange.start && dateRange.end) {
      filtered = filtered.filter((item) => {
        const itemDate = new Date(item.date)
        const startDate = new Date(dateRange.start)
        const endDate = new Date(dateRange.end)
        // Adiciona um dia ao endDate para incluir o dia final completo
        endDate.setDate(endDate.getDate() + 1)
        return itemDate >= startDate && itemDate < endDate
      })
    }
    
    // Ordena os dados por custo, do maior para o menor
    filtered.sort((a, b) => b.cost - a.cost)

    return filtered
  }, [processedData, dateRange])

  // Memoização para paginar os dados filtrados
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredData.slice(startIndex, endIndex)
  }, [filteredData, currentPage, itemsPerPage])

  const totalPages = Math.ceil(filteredData.length / itemsPerPage)

  // --- Métricas Estáticas para os Cards de Resumo ---
  // Conforme solicitado, estes valores são estáticos (hardcoded).
  // Podes ajustar estes valores ou, no futuro, calculá-los dinamicamente a partir dos dados.
  const summaryMetrics = {
    avgCpc: 1.85,
    ctr: 3.15, 
    // Mantive um card de VTR como exemplo, podes alterar ou remover
    avgPosition: 2.1, // Exemplo de uma nova métrica que podes querer adicionar
  }

  // Funções de formatação para números e moeda
  const formatNumber = (value: number): string => {
    return value.toLocaleString("pt-BR")
  }

  const formatCurrency = (value: number): string => {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })
  }

  // Simula um estado de carregamento, podes remover se não for necessário
  const [loading] = useState(false) 
  if (loading) {
    return <Loading message="Carregando palavras-chave..." />
  }

  // A renderização do componente principal
  return (
    <div ref={contentRef} className="space-y-6 h-full flex flex-col">
      {/* 1. Título da Página (Alterado) */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-green-500 rounded-lg flex items-center justify-center">
            {/* Ícone do Google (SVG) */}
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21.35,11.1H12.18V13.83H18.69C18.36,17.64 15.19,19.27 12.19,19.27C8.36,19.27 5.03,16.42 5.03,12.5C5.03,8.58 8.36,5.73 12.19,5.73C14.02,5.73 15.64,6.37 16.84,7.48L19.09,5.23C17.21,3.48 14.95,2.5 12.19,2.5C6.92,2.5 2.73,6.72 2.73,12.5C2.73,18.28 6.92,22.5 12.19,22.5C17.6,22.5 21.54,18.51 21.54,12.81C21.54,12.23 21.48,11.66 21.35,11.1Z" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 text-enhanced">Google Search Keywords</h1>
            {/* 2. Subtítulo da Página (Alterado) */}
            <p className="text-gray-600">Performance das palavras chave em Search Google</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-4 text-sm text-gray-600 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-lg">
            <PDFDownloadButton contentRef={contentRef} fileName="google-search-keywords" />
            <span>Última atualização: {new Date().toLocaleString("pt-BR")}</span>
          </div>
        </div>
      </div>

      {/* 3. Seletor de Período (Mantido) */}
      <div className="card-overlay rounded-lg shadow-lg p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              Período
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Total de Palavras-Chave</label>
            <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-600">
              {filteredData.length} palavras-chave encontradas
            </div>
          </div>
        </div>
      </div>

      {/* 4. Métricas Principais (Cards de Resumo - com valores estáticos) */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <div className="card-overlay rounded-lg shadow-lg p-4 text-center">
          <div className="text-sm text-gray-600 mb-1">CPC Médio</div>
          <div className="text-lg font-bold text-gray-900">{formatCurrency(summaryMetrics.avgCpc)}</div>
        </div>
        <div className="card-overlay rounded-lg shadow-lg p-4 text-center">
          <div className="text-sm text-gray-600 mb-1">CTR</div>
          <div className="text-lg font-bold text-gray-900">{summaryMetrics.ctr.toFixed(2)}%</div>
        </div>
        <div className="card-overlay rounded-lg shadow-lg p-4 text-center">
          <div className="text-sm text-gray-600 mb-1">Posição Média</div>
          <div className="text-lg font-bold text-gray-900">{summaryMetrics.avgPosition.toFixed(1)}</div>
        </div>
      </div>

      {/* 5. Tabela de Dados (Estrutura e colunas alteradas) */}
      <div className="flex-1 card-overlay rounded-lg shadow-lg p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-blue-600 text-white">
                <th className="text-left py-3 px-4 font-semibold">Date</th>
                <th className="text-left py-3 px-4 font-semibold">Keyword</th>
                <th className="text-right py-3 px-4 font-semibold">Cost</th>
                <th className="text-right py-3 px-4 font-semibold">Impressions</th>
                <th className="text-right py-3 px-4 font-semibold">Clicks</th>
                <th className="text-right py-3 px-4 font-semibold">CTR</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((keyword, index) => (
                <tr key={index} className={index % 2 === 0 ? "bg-blue-50" : "bg-white"}>
                  <td className="py-3 px-4 text-sm">{new Date(keyword.date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</td>
                  <td className="py-3 px-4 font-medium text-gray-900 text-sm">{keyword.keyword}</td>
                  <td className="py-3 px-4 text-right font-semibold">{formatCurrency(keyword.cost)}</td>
                  <td className="py-3 px-4 text-right">{formatNumber(keyword.impressions)}</td>
                  <td className="py-3 px-4 text-right">{formatNumber(keyword.clicks)}</td>
                  <td className="py-3 px-4 text-right">{keyword.ctr.toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginação da tabela (mantida) */}
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-500">
            Mostrando {(currentPage - 1) * itemsPerPage + 1} -{" "}
            {Math.min(currentPage * itemsPerPage, filteredData.length)} de {filteredData.length} palavras-chave
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <span className="px-3 py-1 text-sm text-gray-600">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Próximo
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GoogleSearchKeywords
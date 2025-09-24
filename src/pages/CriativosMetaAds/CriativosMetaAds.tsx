"use client"
import { useState, useEffect, useMemo, useCallback, useRef, type FC } from "react"
import { Calendar } from "lucide-react"
import { apiNacional } from "../../services/api"
import Loading from "../../components/Loading/Loading"
import PDFDownloadButton from "../../components/PDFDownloadButton/PDFDownloadButton"
import { googleDriveApi } from "../../services/googleDriveApi"
import MediaThumbnail from "../../components/MediaThumbnail/MediaThumbnail"
import MetaCreativeModal from "./components/MetaCreativeModal"

interface CreativeData {
  date: string
  campaignName: string
  creativeTitle: string
  reach: number
  impressions: number
  clicks: number
  totalSpent: number
  videoViews: number
  videoViews25: number
  videoViews50: number
  videoViews75: number
  videoCompletions: number
  videoStarts: number
  totalEngagements: number
  cpm: number
  cpc: number
  ctr: number
  frequency: number
}

// Hook específico para buscar dados Meta - Tratado
const useMetaTratadoData = () => {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const response = await apiNacional.get(
        "/google/sheets/1eyj0PSNlZvvxnj9H0G0LM_jn2Ry4pSHACH2WwP7xUWw/data?range=Meta%20-%20Tratado",
      )
      setData(response.data.data)
      setError(null)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  return { data, loading, error, refetch: loadData }
}

const CriativosMeta: FC = () => {
  const contentRef = useRef<HTMLDivElement>(null)
  const { data: apiData, loading, error } = useMetaTratadoData()
  const [processedData, setProcessedData] = useState<CreativeData[]>([])
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: "", end: "" })
  
  // 1. GERENCIAMENTO DE ESTADO DO FILTRO
  // Adicionado estado para controlar o filtro de categoria.
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('geral'); // 'geral', 'influenciadores', 'campanhaRegular'
  
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  
  const [creativeMedias, setCreativeMedias] = useState<Map<string, { url: string, type: string }>>(new Map())
  const [mediasLoading, setMediasLoading] = useState(false)

  const [selectedCreative, setSelectedCreative] = useState<CreativeData | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    const loadMedias = async () => {
      setMediasLoading(true)
      try {
        const mediaMap = await googleDriveApi.getPlatformImages("meta")
        setCreativeMedias(mediaMap)
      } catch (error) {
        console.error("Error loading Meta medias:", error)
      } finally {
        setMediasLoading(false)
      }
    }

    loadMedias()
  }, [])

  useEffect(() => {
    if (apiData?.values) {
      const headers = apiData.values[0]
      const rows = apiData.values.slice(1)

      const processed: CreativeData[] = rows
        .map((row: string[]) => {
          const parseNumber = (value: string) => {
            if (!value || value === "") return 0
            return Number.parseFloat(value.replace(/[R$\s.]/g, "").replace(",", ".")) || 0
          }

          const parseInteger = (value: string) => {
            if (!value || value === "") return 0
            return Number.parseInt(value.replace(/[.\s]/g, "").replace(",", "")) || 0
          }

          const date = row[headers.indexOf("Date")] || ""
          const campaignName = row[headers.indexOf("Campaign name")] || ""
          const creativeTitle = row[headers.indexOf("Creative title")] || ""
          const reach = parseInteger(row[headers.indexOf("Reach")])
          const impressions = parseInteger(row[headers.indexOf("Impressions")])
          const clicks = parseInteger(row[headers.indexOf("Clicks")])
          const totalSpent = parseNumber(row[headers.indexOf("Total spent")])
          const videoViews = parseInteger(row[headers.indexOf("Video views ")])
          const videoViews25 = parseInteger(row[headers.indexOf("Video views at 25%")])
          const videoViews50 = parseInteger(row[headers.indexOf("Video views at 50%")])
          const videoViews75 = parseInteger(row[headers.indexOf("Video views at 75%")])
          const videoCompletions = parseInteger(row[headers.indexOf("Video completions ")])
          const videoStarts = parseInteger(row[headers.indexOf("Video starts")])
          const totalEngagements = parseInteger(row[headers.indexOf("Total engagements")])

          const cpm = impressions > 0 ? totalSpent / (impressions / 1000) : 0
          const cpc = clicks > 0 ? totalSpent / clicks : 0
          const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0
          const frequency = reach > 0 ? impressions / reach : 0

          return {
            date,
            campaignName,
            creativeTitle,
            reach,
            impressions,
            clicks,
            totalSpent,
            videoViews,
            videoViews25,
            videoViews50,
            videoViews75,
            videoCompletions,
            videoStarts,
            totalEngagements,
            cpm,
            cpc,
            ctr,
            frequency,
          } as CreativeData
        })
        .filter((item: CreativeData) => item.date && item.impressions > 0)

      setProcessedData(processed)

      if (processed.length > 0) {
        const dates = processed
          .map((item) => {
            const dateParts = item.date.split("/")
            if (dateParts.length === 3) {
              return new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`)
            }
            return new Date(item.date)
          })
          .sort((a, b) => a.getTime() - b.getTime())

        const startDate = dates[0].toISOString().split("T")[0]
        const endDate = dates[dates.length - 1].toISOString().split("T")[0]
        setDateRange({ start: startDate, end: endDate })
      }
    }
  }, [apiData])

  // 3. ATUALIZAÇÃO DA LÓGICA DE FILTRAGEM
  const filteredData = useMemo(() => {
    let filtered = processedData

    // Filtro por período
    if (dateRange.start && dateRange.end) {
      filtered = filtered.filter((item) => {
        const dateParts = item.date.split("/")
        let itemDate: Date
        if (dateParts.length === 3) {
          itemDate = new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`)
        } else {
          itemDate = new Date(item.date)
        }

        const startDate = new Date(dateRange.start)
        const endDate = new Date(dateRange.end)
        return itemDate >= startDate && itemDate <= endDate
      })
    }

    // Nova lógica de filtragem por categoria
    const influencerTerms = ["INFLUENCIADORA_CAROL"];

    if (activeCategoryFilter === 'influenciadores') {
      filtered = filtered.filter(item => 
        influencerTerms.some(term => item.creativeTitle.includes(term))
      );
    } else if (activeCategoryFilter === 'campanhaRegular') {
      filtered = filtered.filter(item => 
        !influencerTerms.some(term => item.creativeTitle.includes(term))
      );
    }
    // Se 'geral', a variável 'filtered' segue sem modificação.

    // Agrupar por criativo APÓS a filtragem
    const groupedData: Record<string, CreativeData> = {}
    filtered.forEach((item) => {
      const key = `${item.creativeTitle}_${item.campaignName}`
      if (!groupedData[key]) {
        groupedData[key] = { ...item }
      } else {
        groupedData[key].impressions += item.impressions
        groupedData[key].reach += item.reach
        groupedData[key].clicks += item.clicks
        groupedData[key].totalSpent += item.totalSpent
        groupedData[key].videoViews += item.videoViews
        groupedData[key].videoViews25 += item.videoViews25
        groupedData[key].videoViews50 += item.videoViews50
        groupedData[key].videoViews75 += item.videoViews75
        groupedData[key].videoCompletions += item.videoCompletions
        groupedData[key].videoStarts += item.videoStarts
        groupedData[key].totalEngagements += item.totalEngagements
      }
    })

    const finalData = Object.values(groupedData).map((item) => ({
      ...item,
      cpm: item.impressions > 0 ? item.totalSpent / (item.impressions / 1000) : 0,
      cpc: item.clicks > 0 ? item.totalSpent / item.clicks : 0,
      ctr: item.impressions > 0 ? (item.clicks / item.impressions) * 100 : 0,
      frequency: item.reach > 0 ? item.impressions / item.reach : 0,
    }))

    finalData.sort((a, b) => b.totalSpent - a.totalSpent)

    return finalData
  }, [processedData, dateRange, activeCategoryFilter]) // Removida dependência selectedPraca

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredData.slice(startIndex, endIndex)
  }, [filteredData, currentPage, itemsPerPage])

  const totalPages = Math.ceil(filteredData.length / itemsPerPage)

  const totals = useMemo(() => {
    return {
      investment: filteredData.reduce((sum, item) => sum + item.totalSpent, 0),
      impressions: filteredData.reduce((sum, item) => sum + item.impressions, 0),
      reach: filteredData.reduce((sum, item) => sum + item.reach, 0),
      clicks: filteredData.reduce((sum, item) => sum + item.clicks, 0),
      videoViews: filteredData.reduce((sum, item) => sum + item.videoViews, 0),
      totalEngagements: filteredData.reduce((sum, item) => sum + item.totalEngagements, 0),
      avgCpm: 0,
      avgCpc: 0,
      avgFrequency: 0,
      ctr: 0,
    }
  }, [filteredData])

  if (filteredData.length > 0) {
    totals.avgCpm = totals.impressions > 0 ? totals.investment / (totals.impressions / 1000) : 0
    totals.avgCpc = totals.clicks > 0 ? totals.investment / totals.clicks : 0
    totals.avgFrequency = totals.reach > 0 ? totals.impressions / totals.reach : 0
    totals.ctr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0
  }

  const formatNumber = (value: number): string => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`
    }
    return value.toLocaleString("pt-BR")
  }

  const formatCurrency = (value: number): string => {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })
  }

  const openCreativeModal = (creative: CreativeData) => {
    const mediaData = googleDriveApi.findMediaForCreative(creative.creativeTitle, creativeMedias)
    
    const creativeWithMedia = {
      ...creative,
      mediaUrl: mediaData?.url || undefined
    }
    
    setSelectedCreative(creativeWithMedia)
    setIsModalOpen(true)
  }

  const closeCreativeModal = () => {
    setIsModalOpen(false)
    setSelectedCreative(null)
  }

  if (loading) {
    return <Loading message="Carregando criativos Meta..." />
  }

  if (error) {
    return (
      <div className="bg-red-50/90 backdrop-blur-sm border border-red-200 rounded-lg p-4">
        <p className="text-red-600">Erro ao carregar dados: {error.message}</p>
      </div>
    )
  }

  return (
    <div ref={contentRef} className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <svg
              className="w-5 h-5"
              xmlns="http://www.w3.org/2000/svg"
              x="0px"
              y="0px"
              width="50"
              height="50"
              viewBox="0 0 50 50"
              fill="currentColor"
            >
              <path d="M47.3,21.01c-0.58-1.6-1.3-3.16-2.24-4.66c-0.93-1.49-2.11-2.93-3.63-4.13c-1.51-1.19-3.49-2.09-5.59-2.26l-0.78-0.04	c-0.27,0.01-0.57,0.01-0.85,0.04c-0.57,0.06-1.11,0.19-1.62,0.34c-1.03,0.32-1.93,0.8-2.72,1.32c-1.42,0.94-2.55,2.03-3.57,3.15	c0.01,0.02,0.03,0.03,0.04,0.05l0.22,0.28c0.51,0.67,1.62,2.21,2.61,3.87c1.23-1.2,2.83-2.65,3.49-3.07	c0.5-0.31,0.99-0.55,1.43-0.68c0.23-0.06,0.44-0.11,0.64-0.12c0.1-0.02,0.19-0.01,0.3-0.02l0.38,0.02c0.98,0.09,1.94,0.49,2.85,1.19	c1.81,1.44,3.24,3.89,4.17,6.48c0.95,2.6,1.49,5.44,1.52,8.18c0,1.31-0.17,2.57-0.57,3.61c-0.39,1.05-1.38,1.45-2.5,1.45	c-1.63,0-2.81-0.7-3.76-1.68c-1.04-1.09-2.02-2.31-2.96-3.61c-0.78-1.09-1.54-2.22-2.26-3.37c-1.27-2.06-2.97-4.67-4.15-6.85	L25,16.35c-0.31-0.39-0.61-0.78-0.94-1.17c-1.11-1.26-2.34-2.5-3.93-3.56c-0.79-0.52-1.69-1-2.72-1.32	c-0.51-0.15-1.05-0.28-1.62-0.34c-0.18-0.02-0.36-0.03-0.54-0.03c-0.11,0-0.21-0.01-0.31-0.01l-0.78,0.04	c-2.1,0.17-4.08,1.07-5.59,2.26c-1.52,1.2-2.7,2.64-3.63,4.13C4,17.85,3.28,19.41,2.7,21.01c-1.13,3.2-1.74,6.51-1.75,9.93	c0.01,1.78,0.24,3.63,0.96,5.47c0.7,1.8,2.02,3.71,4.12,4.77c1.03,0.53,2.2,0.81,3.32,0.81c1.23,0.03,2.4-0.32,3.33-0.77	c1.87-0.93,3.16-2.16,4.33-3.4c2.31-2.51,4.02-5.23,5.6-8c0.44-0.76,0.86-1.54,1.27-2.33c-0.21-0.41-0.42-0.84-0.64-1.29	c-0.62-1.03-1.39-2.25-1.95-3.1c-0.83,1.5-1.69,2.96-2.58,4.41c-1.59,2.52-3.3,4.97-5.21,6.98c-0.95,0.98-2,1.84-2.92,2.25	c-0.47,0.2-0.83,0.27-1.14,0.25c-0.43,0-0.79-0.1-1.13-0.28c-0.67-0.35-1.3-1.1-1.69-2.15c-0.4-1.04-0.57-2.3-0.57-3.61	c0.03-2.74,0.57-5.58,1.52-8.18c0.93-2.59,2.36-5.04,4.17-6.48c0.91-0.7,1.87-1.1,2.85-1.19l0.38-0.02c0.11,0.01,0.2,0,0.3,0.02	c0.2,0.01,0.41,0.06,0.64,0.12c0.26,0.08,0.54,0.19,0.83,0.34c0.2,0.1,0.4,0.21,0.6,0.34c1,0.64,1.99,1.58,2.92,2.62	c0.72,0.81,1.41,1.71,2.1,2.63L25,25.24c0.75,1.55,1.53,3.09,2.39,4.58c1.58,2.77,3.29,5.49,5.6,8c0.68,0.73,1.41,1.45,2.27,2.1	c0.61,0.48,1.28,0.91,2.06,1.3c0.93,0.45,2.1,0.8,3.33,0.77c1.12,0,2.29-0.28,3.32-0.81c2.1-1.06,3.42-2.97,4.12-4.77	c0.72-1.84,0.95-3.69,0.96-5.47C49.04,27.52,48.43,24.21,47.3,21.01z"></path>
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 text-enhanced">Meta - Criativos</h1>
            <p className="text-gray-600">Performance dos criativos no Facebook e Instagram</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-4 text-sm text-gray-600 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-lg">
            <PDFDownloadButton contentRef={contentRef} fileName="criativos-meta" />
            <span>Última atualização: {new Date().toLocaleString("pt-BR")}</span>
          </div>
        </div>
      </div>

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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Influenciadores/Campanha
            </label>
            <div className="flex space-x-2 bg-gray-50 border border-gray-300 rounded-md p-1">
              <button
                onClick={() => setActiveCategoryFilter('geral')}
                className={`flex-1 px-3 py-1.5 text-sm rounded-md transition-colors duration-200 ${
                  activeCategoryFilter === 'geral'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-transparent text-gray-600 hover:bg-gray-200'
                }`}
              >
                Geral
              </button>
              <button
                onClick={() => setActiveCategoryFilter('influenciadores')}
                className={`flex-1 px-3 py-1.5 text-sm rounded-md transition-colors duration-200 ${
                  activeCategoryFilter === 'influenciadores'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-transparent text-gray-600 hover:bg-gray-200'
                }`}
              >
                Influenciadores
              </button>
              <button
                onClick={() => setActiveCategoryFilter('campanhaRegular')}
                className={`flex-1 px-3 py-1.5 text-sm rounded-md transition-colors duration-200 ${
                  activeCategoryFilter === 'campanhaRegular'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-transparent text-gray-600 hover:bg-gray-200'
                }`}
              >
                Campanha Regular
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <div className="card-overlay rounded-lg shadow-lg p-4 text-center">
          <div className="text-sm text-gray-600 mb-1">Investimento</div>
          <div className="text-lg font-bold text-gray-900">{formatCurrency(totals.investment)}</div>
        </div>

        <div className="card-overlay rounded-lg shadow-lg p-4 text-center">
          <div className="text-sm text-gray-600 mb-1">Impressões</div>
          <div className="text-lg font-bold text-gray-900">{formatNumber(totals.impressions)}</div>
        </div>

        <div className="card-overlay rounded-lg shadow-lg p-4 text-center">
          <div className="text-sm text-gray-600 mb-1">Alcance</div>
          <div className="text-lg font-bold text-gray-900">{formatNumber(totals.reach)}</div>
        </div>

        <div className="card-overlay rounded-lg shadow-lg p-4 text-center">
          <div className="text-sm text-gray-600 mb-1">Cliques</div>
          <div className="text-lg font-bold text-gray-900">{formatNumber(totals.clicks)}</div>
        </div>

        <div className="card-overlay rounded-lg shadow-lg p-4 text-center">
          <div className="text-sm text-gray-600 mb-1">CPM</div>
          <div className="text-lg font-bold text-gray-900">{formatCurrency(totals.avgCpm)}</div>
        </div>

        <div className="card-overlay rounded-lg shadow-lg p-4 text-center">
          <div className="text-sm text-gray-600 mb-1">CPC</div>
          <div className="text-lg font-bold text-gray-900">{formatCurrency(totals.avgCpc)}</div>
        </div>

        <div className="card-overlay rounded-lg shadow-lg p-4 text-center">
          <div className="text-sm text-gray-600 mb-1">CTR</div>
          <div className="text-lg font-bold text-gray-900">{totals.ctr.toFixed(2)}%</div>
        </div>

        <div className="card-overlay rounded-lg shadow-lg p-4 text-center">
          <div className="text-sm text-gray-600 mb-1">Frequência</div>
          <div className="text-lg font-bold text-gray-900">{totals.avgFrequency.toFixed(2)}</div>
        </div>
      </div>

      <div className="flex-1 card-overlay rounded-lg shadow-lg p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-blue-600 text-white">
                <th className="text-left py-3 px-4 font-semibold w-[5rem]">Mídia</th>
                <th className="text-left py-3 px-4 font-semibold">Criativo</th>
                <th className="text-right py-3 px-4 font-semibold min-w-[7.5rem]">Investimento</th>
                <th className="text-right py-3 px-4 font-semibold min-w-[7.5rem]">Impressões</th>
                <th className="text-right py-3 px-4 font-semibold min-w-[7.5rem]">Alcance</th>
                <th className="text-right py-3 px-4 font-semibold min-w-[7.5rem]">Cliques</th>
                <th className="text-right py-3 px-4 font-semibold min-w-[7.5rem]">Visualizações</th>
                <th className="text-right py-3 px-4 font-semibold min-w-[7.5rem]">CPM</th>
                <th className="text-right py-3 px-4 font-semibold min-w-[7.5rem]">CPC</th>
                <th className="text-right py-3 px-4 font-semibold min-w-[7.5rem]">CTR</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((creative, index) => {
                const mediaData = googleDriveApi.findMediaForCreative(creative.creativeTitle, creativeMedias)

                return (
                  <tr key={index} className={index % 2 === 0 ? "bg-blue-50" : "bg-white"}>
                    <td className="py-3 px-4 w-[5rem]">
                      <MediaThumbnail
                        mediaData={mediaData}
                        creativeName={creative.creativeTitle}
                        isLoading={mediasLoading}
                        size="md"
                        onClick={() => openCreativeModal(creative)}
                      />
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-gray-900 text-sm leading-tight whitespace-normal break-words">
                          {creative.creativeTitle}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 leading-tight whitespace-normal break-words">
                          {creative.campaignName}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold min-w-[7.5rem]">
                      {formatCurrency(creative.totalSpent)}
                    </td>
                    <td className="py-3 px-4 text-right min-w-[7.5rem]">{formatNumber(creative.impressions)}</td>
                    <td className="py-3 px-4 text-right min-w-[7.5rem]">{formatNumber(creative.reach)}</td>
                    <td className="py-3 px-4 text-right min-w-[7.5rem]">{formatNumber(creative.clicks)}</td>
                    <td className="py-3 px-4 text-right min-w-[7.5rem]">{formatNumber(creative.videoViews)}</td>
                    <td className="py-3 px-4 text-right min-w-[7.5rem]">{formatCurrency(creative.cpm)}</td>
                    <td className="py-3 px-4 text-right min-w-[7.5rem]">{formatCurrency(creative.cpc)}</td>
                    <td className="py-3 px-4 text-right min-w-[7.5rem]">{creative.ctr.toFixed(2)}%</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-500">
            Mostrando {(currentPage - 1) * itemsPerPage + 1} -{" "}
            {Math.min(currentPage * itemsPerPage, filteredData.length)} de {filteredData.length} criativos
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

      <MetaCreativeModal 
        creative={selectedCreative}
        isOpen={isModalOpen}
        onClose={closeCreativeModal}
      />
    </div>
  )
}

export default CriativosMeta
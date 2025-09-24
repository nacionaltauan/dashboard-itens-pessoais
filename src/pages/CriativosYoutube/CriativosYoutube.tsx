"use client"
import { useState, useEffect, useMemo, useCallback, useRef, type FC } from "react"
import { Calendar } from "lucide-react"
import { apiNacional } from "../../services/api"
import Loading from "../../components/Loading/Loading"
import PDFDownloadButton from "../../components/PDFDownloadButton/PDFDownloadButton"
import { googleDriveApi } from "../../services/googleDriveApi"
import MediaThumbnail from "../../components/MediaThumbnail/MediaThumbnail"
import YoutubeCreativeModal from "./components/YoutubeCreativeModal"

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

// Hook específico para buscar dados Google - Tratado
const useGoogleTratadoData = () => {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const response = await apiNacional.get(
        "/google/sheets/1eyj0PSNlZvvxnj9H0G0LM_jn2Ry4pSHACH2WwP7xUWw/data?range=Google%20-%20Tratado",
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

const CriativosYoutube: FC = () => {
  const contentRef = useRef<HTMLDivElement>(null)
  const { data: apiData, loading, error } = useGoogleTratadoData()
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
        const mediaMap = await googleDriveApi.getPlatformImages("youtube")
        setCreativeMedias(mediaMap)
      } catch (error) {
        console.error("Error loading YouTube medias:", error)
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
    const influencerTerms = ["BRASILSEG2025_INFLUENCIADOR HENRY"];

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
  }, [processedData, dateRange, activeCategoryFilter])

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
    return <Loading message="Carregando criativos YouTube..." />
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
          <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 text-enhanced">YouTube - Criativos</h1>
            <p className="text-gray-600">Performance dos criativos no YouTube</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-4 text-sm text-gray-600 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-lg">
            <PDFDownloadButton contentRef={contentRef} fileName="criativos-youtube" />
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
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
              />
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
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
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'bg-transparent text-gray-600 hover:bg-gray-200'
                }`}
              >
                Geral
              </button>
              <button
                onClick={() => setActiveCategoryFilter('influenciadores')}
                className={`flex-1 px-3 py-1.5 text-sm rounded-md transition-colors duration-200 ${
                  activeCategoryFilter === 'influenciadores'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'bg-transparent text-gray-600 hover:bg-gray-200'
                }`}
              >
                Influenciadores
              </button>
              <button
                onClick={() => setActiveCategoryFilter('campanhaRegular')}
                className={`flex-1 px-3 py-1.5 text-sm rounded-md transition-colors duration-200 ${
                  activeCategoryFilter === 'campanhaRegular'
                    ? 'bg-red-600 text-white shadow-sm'
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
              <tr className="bg-red-600 text-white">
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
                  <tr key={index} className={index % 2 === 0 ? "bg-red-50" : "bg-white"}>
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

      <YoutubeCreativeModal 
        creative={selectedCreative}
        isOpen={isModalOpen}
        onClose={closeCreativeModal}
      />
    </div>
  )
}

export default CriativosYoutube
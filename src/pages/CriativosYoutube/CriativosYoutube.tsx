"use client"

import type React from "react"
import { useState, useEffect, useMemo, useRef } from "react"
import { Calendar } from "lucide-react"
import { useYouTubeNacionalData } from "../../services/api"
import Loading from "../../components/Loading/Loading"
import { googleDriveApi } from "../../services/googleDriveApi"
import PDFDownloadButton from "../../components/PDFDownloadButton/PDFDownloadButton"
import MediaThumbnail from "../../components/MediaThumbnail/MediaThumbnail"
import YoutubeCreativeModal from "./components/YoutubeCreativeModal"

interface CreativeData {
  date: string
  campaignName: string
  adGroupName: string
  adName: string
  adText: string
  videoThumbnailUrl: string
  impressions: number
  clicks: number
  cost: number
  cpc: number
  cpm: number
  reach: number
  frequency: number
  results: number
  videoViews: number
  twoSecondVideoViews: number
  videoViews25: number
  videoViews50: number
  videoViews75: number
  videoViews100: number
  profileVisits: number
  paidLikes: number
  paidComments: number
  paidShares: number
  paidFollows: number
}

interface YoutubeCreativeData {
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
  mediaUrl?: string
}

const CriativosYoutube: React.FC = () => {
  const contentRef = useRef<HTMLDivElement>(null)
  const { data: apiData, loading, error } = useYouTubeNacionalData()
  const [processedData, setProcessedData] = useState<CreativeData[]>([])
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: "", end: "" })
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('geral')

  const [creativeMedias, setCreativeMedias] = useState<Map<string, { url: string, type: string }>>(new Map())
  const [mediasLoading, setMediasLoading] = useState(false)

  const [selectedCreative, setSelectedCreative] = useState<YoutubeCreativeData | null>(null)
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
    const values = apiData?.data?.values
    if (!values || values.length <= 1) {
      console.log("YouTube: No data available or insufficient rows")
      return
    }

    console.log("YouTube: Data received", { 
      totalRows: values.length, 
      headers: values[0],
      firstRow: values[1] 
    })

    const headers = values[0]
    const rows = values.slice(1)

    const parseNumber = (v: string) => {
      if (!v?.trim()) return 0
      const clean = v
        .replace(/[R$\s]/g, "")
        .replace(/\./g, "")
        .replace(",", ".")
      return isNaN(+clean) ? 0 : +clean
    }

    const parseInteger = (v: string) => {
      if (!v?.trim()) return 0
      const clean = v.replace(/\./g, "").replace(",", "")
      const n = Number.parseInt(clean, 10)
      return isNaN(n) ? 0 : n
    }

    // Função para converter data brasileira (DD/MM/YYYY) para formato ISO
    const parseBrazilianDate = (dateStr: string): string => {
      if (!dateStr?.trim()) return ""
      
      // Dividir a data em partes
      const parts = dateStr.split("/")
      if (parts.length !== 3) return ""
      
      const [day, month, year] = parts
      
      // Criar data no formato YYYY-MM-DD
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    }

    const mapped: CreativeData[] = rows.map((row: string[]) => {
      const get = (field: string) => {
        const idx = headers.indexOf(field)
        return idx >= 0 ? (row[idx] ?? "") : ""
      }
      return {
        date: parseBrazilianDate(get("Date")),
        campaignName: get("Campaign name"),
        adGroupName: get("Creative title"), // Usando Creative title como adGroupName
        adName: get("Creative title"),
        adText: get("Creative title"), // Usando Creative title como adText também
        videoThumbnailUrl: "", // Não há thumbnail URL na planilha
        impressions: parseInteger(get("Impressions")),
        clicks: parseInteger(get("Clicks")),
        cost: parseNumber(get("Total spent")),
        cpc: 0, // Não há CPC na planilha
        cpm: 0, // Não há CPM na planilha
        reach: parseInteger(get("Reach")),
        frequency: 0, // Não há frequency na planilha
        results: parseInteger(get("Total engagements")),
        videoViews: parseInteger(get("Video views ")), // Note o espaço extra
        twoSecondVideoViews: parseInteger(get("Video starts")),
        videoViews25: parseInteger(get("Video views at 25%")),
        videoViews50: parseInteger(get("Video views at 50%")),
        videoViews75: parseInteger(get("Video views at 75%")),
        videoViews100: parseInteger(get("Video completions")),
        profileVisits: 0, // Não há profile visits na planilha
        paidLikes: 0, // Não há paid likes na planilha
        paidComments: 0, // Não há paid comments na planilha
        paidShares: 0, // Não há paid shares na planilha
        paidFollows: 0, // Não há paid follows na planilha
      }
    })

    const processed: CreativeData[] = mapped.filter((item: CreativeData): item is CreativeData => {
      if (!item.date) {
        console.log("YouTube: Item without date", item)
        return false
      }
      
      // Verificar se a data é válida
      const date = new Date(item.date)
      const isValid = !isNaN(date.getTime())
      
      if (!isValid) {
        console.log("YouTube: Invalid date", { date: item.date, parsed: date })
      }
      
      return isValid
    })

    console.log("YouTube: Processed data", { 
      total: processed.length,
      sample: processed[0] 
    })

    setProcessedData(processed)

    const allDates = processed
      .map((i) => new Date(i.date))
      .filter(date => !isNaN(date.getTime())) // Filtrar datas inválidas
      .sort((a, b) => a.getTime() - b.getTime())

    if (allDates.length > 0) {
      setDateRange({
        start: allDates[0].toISOString().slice(0, 10),
        end: allDates[allDates.length - 1].toISOString().slice(0, 10),
      })
    }
  }, [apiData])

  const filteredData = useMemo(() => {
    let filtered = processedData

    if (dateRange.start && dateRange.end) {
      filtered = filtered.filter((item) => {
        const itemDate = new Date(item.date)
        const startDate = new Date(dateRange.start)
        const endDate = new Date(dateRange.end)
        
        // Verificar se as datas são válidas
        if (isNaN(itemDate.getTime()) || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          return false
        }
        
        return itemDate >= startDate && itemDate <= endDate
      })
    }

    const influencerTerms = ["INFLUENCIADOR HENRI"];

    if (activeCategoryFilter === 'influenciadores') {
      filtered = filtered.filter(item => 
        influencerTerms.some(term => item.adName.includes(term))
      );
    } else if (activeCategoryFilter === 'campanhaRegular') {
      filtered = filtered.filter(item => 
        !influencerTerms.some(term => item.adName.includes(term))
      );
    }

    const groupedData: Record<string, CreativeData> = {}
    filtered.forEach((item) => {
      const key = `${item.adName}_${item.videoThumbnailUrl || "no-thumbnail"}`
      if (!groupedData[key]) {
        groupedData[key] = { ...item }
      } else {
        groupedData[key].impressions += item.impressions
        groupedData[key].clicks += item.clicks
        groupedData[key].cost += item.cost
        groupedData[key].reach += item.reach
        groupedData[key].results += item.results
        groupedData[key].videoViews += item.videoViews
        groupedData[key].twoSecondVideoViews += item.twoSecondVideoViews
        groupedData[key].videoViews25 += item.videoViews25
        groupedData[key].videoViews50 += item.videoViews50
        groupedData[key].videoViews75 += item.videoViews75
        groupedData[key].videoViews100 += item.videoViews100
        groupedData[key].profileVisits += item.profileVisits
        groupedData[key].paidLikes += item.paidLikes
        groupedData[key].paidComments += item.paidComments
        groupedData[key].paidShares += item.paidShares
        groupedData[key].paidFollows += item.paidFollows
      }
    })

    const finalData = Object.values(groupedData).map((item) => ({
      ...item,
      cpm: item.impressions > 0 ? item.cost / (item.impressions / 1000) : 0,
      cpc: item.clicks > 0 ? item.cost / item.clicks : 0,
      frequency: item.reach > 0 ? item.impressions / item.reach : 0,
    }))

    finalData.sort((a, b) => b.cost - a.cost)

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
      investment: filteredData.reduce((sum, item) => sum + item.cost, 0),
      impressions: filteredData.reduce((sum, item) => sum + item.impressions, 0),
      reach: filteredData.reduce((sum, item) => sum + item.reach, 0),
      clicks: filteredData.reduce((sum, item) => sum + item.clicks, 0),
      videoViews: filteredData.reduce((sum, item) => sum + item.videoViews, 0),
      videoViews100: filteredData.reduce((sum, item) => sum + item.videoViews100, 0),
      paidLikes: filteredData.reduce((sum, item) => sum + item.paidLikes, 0),
      avgCpm: 0,
      avgCpc: 0,
      avgFrequency: 0,
      ctr: 0,
      vtr: 0,
    }
  }, [filteredData])

  if (filteredData.length > 0) {
    totals.avgCpm = totals.impressions > 0 ? totals.investment / (totals.impressions / 1000) : 0
    totals.avgCpc = totals.clicks > 0 ? totals.investment / totals.clicks : 0
    totals.avgFrequency = totals.reach > 0 ? totals.impressions / totals.reach : 0
    totals.ctr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0
    totals.vtr = totals.impressions > 0 ? (totals.videoViews100 / totals.impressions) * 100 : 0
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
    const driveMediaData = googleDriveApi.findMediaForCreative(creative.adName, creativeMedias)
    
    const youtubeCreative: YoutubeCreativeData = {
      date: creative.date,
      campaignName: creative.campaignName,
      creativeTitle: creative.adName,
      reach: creative.reach,
      impressions: creative.impressions,
      clicks: creative.clicks,
      totalSpent: creative.cost,
      videoViews: creative.videoViews,
      videoViews25: creative.videoViews25,
      videoViews50: creative.videoViews50,
      videoViews75: creative.videoViews75,
      videoCompletions: creative.videoViews100,
      videoStarts: creative.twoSecondVideoViews,
      totalEngagements: creative.paidLikes + creative.paidComments + creative.paidShares + creative.paidFollows,
      cpm: creative.cpm,
      cpc: creative.cpc,
      ctr: creative.impressions > 0 ? (creative.clicks / creative.impressions) * 100 : 0,
      frequency: creative.frequency,
      mediaUrl: driveMediaData?.url || creative.videoThumbnailUrl || undefined
    }
    
    setSelectedCreative(youtubeCreative)
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
        <p className="text-red-500 text-sm mt-2">
          Verifique se a API está funcionando corretamente:
          https://nacional-api-gray.vercel.app/google/sheets/1eyj0PSNlZvvxnj9H0G0LM_jn2Ry4pSHACH2WwP7xUWw/data?range=Google%20-%20Tratado
        </p>
      </div>
    )
  }

  return (
    <div ref={contentRef} className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 text-enhanced">YouTube - Criativos</h1>
            <p className="text-gray-600">Performance dos criativos na plataforma YouTube</p>
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
          <div className="text-sm text-gray-600 mb-1">CPC</div>
          <div className="text-lg font-bold text-gray-900">{formatCurrency(totals.avgCpc)}</div>
        </div>

        <div className="card-overlay rounded-lg shadow-lg p-4 text-center">
          <div className="text-sm text-gray-600 mb-1">CTR</div>
          <div className="text-lg font-bold text-gray-900">{totals.ctr.toFixed(2)}%</div>
        </div>

        <div className="card-overlay rounded-lg shadow-lg p-4 text-center">
          <div className="text-sm text-gray-600 mb-1">VTR</div>
          <div className="text-lg font-bold text-gray-900">{totals.vtr.toFixed(2)}%</div>
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
                <th className="text-right py-3 px-4 font-semibold min-w-[7.5rem]">Views 100%</th>
                <th className="text-right py-3 px-4 font-semibold min-w-[7.5rem]">Likes</th>
                <th className="text-right py-3 px-4 font-semibold min-w-[7.5rem]">VTR</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((creative, index) => {
                const vtr = creative.impressions > 0 ? (creative.videoViews100 / creative.impressions) * 100 : 0
                const driveMediaData = googleDriveApi.findMediaForCreative(creative.adName, creativeMedias)
                const youtubeThumbnail = creative.videoThumbnailUrl

                return (
                  <tr key={index} className={index % 2 === 0 ? "bg-red-50" : "bg-white"}>
                    <td className="py-3 px-4 w-[5rem]">
                      {driveMediaData ? (
                        <MediaThumbnail
                          mediaData={driveMediaData}
                          creativeName={creative.adName}
                          isLoading={mediasLoading}
                          size="md"
                          onClick={() => openCreativeModal(creative)}
                        />
                      ) : youtubeThumbnail ? (
                        <div 
                          className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center relative cursor-pointer group"
                          onClick={() => openCreativeModal(creative)}
                        >
                          <img
                            src={youtubeThumbnail}
                            alt="Thumbnail YouTube"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.style.display = "none"
                              if (target.parentElement) {
                                target.parentElement.innerHTML =
                                  '<div class="text-gray-400 text-xs text-center">Sem mídia</div>'
                              }
                            }}
                          />
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black bg-opacity-40">
                            <div className="bg-white bg-opacity-90 rounded-full p-2 shadow-sm">
                              <svg className="w-4 h-4 text-gray-700 fill-gray-700" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z"/>
                              </svg>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <MediaThumbnail
                          mediaData={null}
                          creativeName={creative.adName}
                          isLoading={mediasLoading}
                          size="md"
                          onClick={() => openCreativeModal(creative)}
                        />
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-gray-900 text-sm leading-tight whitespace-normal break-words">
                          {creative.adName}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 leading-tight whitespace-normal break-words">
                          {creative.campaignName}
                        </p>
                        {creative.adText && (
                          <p className="text-xs text-gray-400 mt-1 leading-tight whitespace-normal break-words">
                            {creative.adText.length > 100 ? creative.adText.substring(0, 100) + "..." : creative.adText}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold min-w-[7.5rem]">
                      {formatCurrency(creative.cost)}
                    </td>
                    <td className="py-3 px-4 text-right min-w-[7.5rem]">{formatNumber(creative.impressions)}</td>
                    <td className="py-3 px-4 text-right min-w-[7.5rem]">{formatNumber(creative.reach)}</td>
                    <td className="py-3 px-4 text-right min-w-[7.5rem]">{formatNumber(creative.clicks)}</td>
                    <td className="py-3 px-4 text-right min-w-[7.5rem]">{formatNumber(creative.videoViews100)}</td>
                    <td className="py-3 px-4 text-right min-w-[7.5rem]">{formatNumber(creative.paidLikes)}</td>
                    <td className="py-3 px-4 text-right min-w-[7.5rem]">{vtr.toFixed(2)}%</td>
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

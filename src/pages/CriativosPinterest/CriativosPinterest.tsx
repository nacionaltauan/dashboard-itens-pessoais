"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { Calendar, Filter, ArrowUpDown } from "lucide-react"
import { usePinterestNacionalData } from "../../services/api"
import Loading from "../../components/Loading/Loading"
import { googleDriveApi } from "../../services/googleDriveApi"
import MediaThumbnail from "../../components/MediaThumbnail/MediaThumbnail" // Importe o novo componente
import CreativeModal from "./components/CreativeModal" // Modal do Pinterest já existe

interface CreativeData {
  date: string
  advertiserName: string
  campaignName: string
  adGroupName: string
  adId: string
  destinationUrl: string
  promotedPinName: string
  promotedPinStatus: string
  creativeType: string
  impressions: number
  reach: number
  frequency: number
  clicks: number
  ctr: number
  outboundClicks: number
  cpm: number
  cpc: number
  cost: number
  videoStartsPaid: number
  videoViewsPaid: number
  videoAvgWatchTime: number
  videoViews100Paid: number
  videoViews25Paid: number
  videoViews50Paid: number
  videoViews75Paid: number
  engagements: number
  mediaUrl?: string
  pontuacaoCriativo?: number
  tipoCompra?: string
  videoEstaticoAudio?: string
}

const CriativosPinterest: React.FC = () => {
  const { data: apiData, loading, error } = usePinterestNacionalData()

  const [processedData, setProcessedData] = useState<CreativeData[]>([])
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: "", end: "" })
  const [selectedCampaign, setSelectedCampaign] = useState<string>("")
  const [availableCampaigns, setAvailableCampaigns] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc")

  // Mudança principal: usar novo tipo de dados para mídias
  const [creativeMedias, setCreativeMedias] = useState<Map<string, { url: string, type: string }>>(new Map())
  const [mediasLoading, setMediasLoading] = useState(false)

  // Estados do modal
  const [selectedCreative, setSelectedCreative] = useState<CreativeData | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    const loadMedias = async () => {
      setMediasLoading(true)
      try {
        const mediaMap = await googleDriveApi.getPlatformImages("pinterest")
        setCreativeMedias(mediaMap)
      } catch (error) {
        console.error("Error loading Pinterest medias:", error)
      } finally {
        setMediasLoading(false)
      }
    }

    loadMedias()
  }, [])

  useEffect(() => {
    console.log("API Data received:", apiData)

    if (apiData?.data?.values && Array.isArray(apiData.data.values)) {
      const headers = apiData.data.values[0]
      const rows = apiData.data.values.slice(1)

      console.log("Headers:", headers)
      console.log("Sample row:", rows[0])

      const processed: CreativeData[] = rows
        .map((row: string[], index: number) => {
          try {
            const parseNumber = (value: string) => {
              if (!value || value === "") return 0
              return Number.parseFloat(value.replace(/[R$\s.]/g, "").replace(",", ".")) || 0
            }

            const parseInteger = (value: string) => {
              if (!value || value === "") return 0
              return Number.parseInt(value.replace(/[.\s]/g, "").replace(",", "")) || 0
            }

            const creativeData = {
              date: row[headers.indexOf("Date")] || "",
              advertiserName: row[headers.indexOf("Advertiser name")] || "",
              campaignName: row[headers.indexOf("Campaign name")] || "",
              adGroupName: row[headers.indexOf("Ad group name")] || "",
              adId: row[headers.indexOf("Ad ID")] || "",
              destinationUrl: row[headers.indexOf("Destination URL")] || "",
              promotedPinName: row[headers.indexOf("Promoted pin name")] || "",
              promotedPinStatus: row[headers.indexOf("Promoted pin status")] || "",
              creativeType: row[headers.indexOf("Creative type")] || "",
              impressions: parseInteger(row[headers.indexOf("Impressions")]),
              reach: parseInteger(row[headers.indexOf("Reach")]),
              frequency: parseNumber(row[headers.indexOf("Frequency")]),
              clicks: parseInteger(row[headers.indexOf("Clicks")]),
              ctr: parseNumber(row[headers.indexOf("CTR")]),
              outboundClicks: parseInteger(row[headers.indexOf("Outbound clicks")]),
              cpm: parseNumber(row[headers.indexOf("CPM")]),
              cpc: parseNumber(row[headers.indexOf("CPC")]),
              cost: parseNumber(row[headers.indexOf("Cost")]),
              videoStartsPaid: parseInteger(row[headers.indexOf("Video starts paid")]),
              videoViewsPaid: parseInteger(row[headers.indexOf("Video views paid")]),
              videoAvgWatchTime: parseNumber(row[headers.indexOf("Video avg. watch time (s) paid")]),
              videoViews100Paid: parseInteger(row[headers.indexOf("Video views at 100% paid")]),
              videoViews25Paid: parseInteger(row[headers.indexOf("Video views at 25% paid")]),
              videoViews50Paid: parseInteger(row[headers.indexOf("Video views at 50% paid")]),
              videoViews75Paid: parseInteger(row[headers.indexOf("Video views at 75% paid")]),
              engagements: parseInteger(row[headers.indexOf("Engagements")]),
            } as CreativeData

            return creativeData
          } catch (error) {
            console.error(`Error processing row ${index}:`, error, row)
            return null
          }
        })
        .filter(
          (item: CreativeData | null): item is CreativeData => item !== null && !!item.date && item.impressions > 0,
        )

      console.log("Processed data:", processed)
      setProcessedData(processed)

      if (processed.length > 0) {
        const dates = processed.map((item) => new Date(item.date)).sort((a, b) => a.getTime() - b.getTime())

        setDateRange({
          start: dates[0].toISOString().split("T")[0],
          end: dates[dates.length - 1].toISOString().split("T")[0],
        })
      }

      const campaignSet = new Set<string>()
      processed.forEach((item) => {
        if (item.campaignName) campaignSet.add(item.campaignName)
      })
      setAvailableCampaigns(Array.from(campaignSet).filter(Boolean))
    }
  }, [apiData])

  const filteredData = useMemo(() => {
    let filtered = processedData

    if (dateRange.start && dateRange.end) {
      filtered = filtered.filter((item) => {
        const itemDate = new Date(item.date)
        return itemDate >= new Date(dateRange.start) && itemDate <= new Date(dateRange.end)
      })
    }

    if (selectedCampaign) {
      filtered = filtered.filter((item) => item.campaignName.includes(selectedCampaign))
    }

    const groupedData: Record<string, CreativeData> = {}
    filtered.forEach((item) => {
      const key = `${item.promotedPinName}_${item.campaignName}_${item.adId}`
      if (!groupedData[key]) {
        groupedData[key] = { ...item }
      } else {
        groupedData[key].impressions += item.impressions
        groupedData[key].reach += item.reach
        groupedData[key].clicks += item.clicks
        groupedData[key].cost += item.cost
        groupedData[key].outboundClicks += item.outboundClicks
        groupedData[key].engagements += item.engagements
        groupedData[key].videoStartsPaid += item.videoStartsPaid
        groupedData[key].videoViewsPaid += item.videoViewsPaid
        groupedData[key].videoViews25Paid += item.videoViews25Paid
        groupedData[key].videoViews50Paid += item.videoViews50Paid
        groupedData[key].videoViews75Paid += item.videoViews75Paid
        groupedData[key].videoViews100Paid += item.videoViews100Paid
      }
    })

    const finalData = Object.values(groupedData).map((item) => ({
      ...item,
      cpm: item.impressions > 0 ? item.cost / (item.impressions / 1000) : 0,
      cpc: item.clicks > 0 ? item.cost / item.clicks : 0,
      ctr: item.impressions > 0 ? (item.clicks / item.impressions) * 100 : 0,
      frequency: item.reach > 0 ? item.impressions / item.reach : 0,
    }))

    finalData.sort((a, b) => {
      if (sortOrder === "desc") {
        return b.cost - a.cost
      }
      return a.cost - b.cost
    })

    return finalData
  }, [processedData, selectedCampaign, dateRange, sortOrder])

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredData.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredData, currentPage, itemsPerPage])

  const totalPages = Math.ceil(filteredData.length / itemsPerPage)

  const totals = useMemo(() => {
    const result = {
      investment: filteredData.reduce((sum, item) => sum + item.cost, 0),
      impressions: filteredData.reduce((sum, item) => sum + item.impressions, 0),
      reach: filteredData.reduce((sum, item) => sum + item.reach, 0),
      clicks: filteredData.reduce((sum, item) => sum + item.clicks, 0),
      outboundClicks: filteredData.reduce((sum, item) => sum + item.outboundClicks, 0),
      engagements: filteredData.reduce((sum, item) => sum + item.engagements, 0),
      avgCpm: 0,
      avgCpc: 0,
      avgFrequency: 0,
      ctr: 0,
    }

    if (filteredData.length > 0) {
      result.avgCpm = result.impressions > 0 ? result.investment / (result.impressions / 1000) : 0
      result.avgCpc = result.clicks > 0 ? result.investment / result.clicks : 0
      result.avgFrequency = result.reach > 0 ? result.impressions / result.reach : 0
      result.ctr = result.impressions > 0 ? (result.clicks / result.impressions) * 100 : 0
    }

    return result
  }, [filteredData])

  const formatNumber = (value: number): string => {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
    return value.toLocaleString("pt-BR")
  }

  const formatCurrency = (value: number): string =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

  const truncateText = (text: string, maxLength: number): string =>
    text.length > maxLength ? `${text.substring(0, maxLength)}...` : text

  // Função para abrir o modal
  const openCreativeModal = (creative: CreativeData) => {
    // Buscar URL da mídia do Google Drive
    const mediaData = googleDriveApi.findMediaForCreative(creative.promotedPinName, creativeMedias)
    
    // Criar objeto com mediaUrl para o modal
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
    return <Loading message="Carregando criativos Pinterest..." />
  }

  if (error) {
    return (
      <div className="bg-red-50/90 backdrop-blur-sm border border-red-200 rounded-lg p-4">
        <p className="text-red-600">Erro ao carregar dados: {error?.message}</p>
      </div>
    )
  }

  console.log("Filtered data length:", filteredData.length)
  console.log("Processed data length:", processedData.length)

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-red-600 to-red-700 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 19c-.721 0-1.418-.109-2.073-.312.286-.465.713-1.227.87-1.835l.437-1.664c.229.436.895.813 1.604.813 2.111 0 3.633-1.941 3.633-4.354 0-2.312-1.888-4.042-4.316-4.042-3.021 0-4.625 2.027-4.625 4.235 0 1.027.547 2.305 1.422 2.712.142.062.217.035.251-.097l.296-1.154c.038-.148.023-.196-.088-.322-.243-.275-.425-.713-.425-1.197 0-1.292.967-2.531 2.608-2.531 1.423 0 2.408.973 2.408 2.361 0 1.588-.632 2.713-1.425 2.713-.456 0-.796-.387-.687-.857l.313-1.228c.092-.366.277-1.495.277-1.854 0-.428-.229-.784-.706-.784-.559 0-1.006.577-1.006 1.35 0 .493.167.827.167.827s-.574 2.43-.675 2.85c-.128.538-.057 1.319-.03 1.742C5.867 18.06 2 15.414 2 12 2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 text-enhanced">Criativos Pinterest</h1>
            <p className="text-gray-600">Performance dos criativos na plataforma Pinterest</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-lg">
            Última atualização: {new Date().toLocaleString("pt-BR")}
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
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <Filter className="w-4 h-4 mr-2" />
              Campanha
            </label>
            <select
              value={selectedCampaign}
              onChange={(e) => setSelectedCampaign(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
            >
              <option value="">Todas as campanhas</option>
              {availableCampaigns.map((campaign, index) => (
                <option key={index} value={campaign}>
                  {truncateText(campaign, 50)}
                </option>
              ))}
            </select>
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
          <div className="text-sm text-gray-600 mb-1">Cliques no Link</div>
          <div className="text-lg font-bold text-gray-900">{formatNumber(totals.outboundClicks)}</div>
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
          <div className="text-sm text-gray-600 mb-1">Engajamentos</div>
          <div className="text-lg font-bold text-gray-900">{formatNumber(totals.engagements)}</div>
        </div>
      </div>

      <div className="flex-1 card-overlay rounded-lg shadow-lg p-6">
        {filteredData.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Nenhum dado encontrado para os filtros selecionados.</p>
            <p className="text-sm text-gray-400 mt-2">Total de registros processados: {processedData.length}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-red-600 text-white">
                    <th className="text-left py-3 px-4 font-semibold w-[5rem]">Mídia</th>
                    <th className="text-left py-3 px-4 font-semibold">Pin</th>
                    <th
                      className="text-right py-3 px-4 font-semibold min-w-[7.5rem] cursor-pointer"
                      onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                    >
                      <div className="flex items-center justify-end">
                        Investimento
                        <ArrowUpDown className="w-4 h-4 ml-2" />
                      </div>
                    </th>
                    <th className="text-right py-3 px-4 font-semibold min-w-[7.5rem]">Impressões</th>
                    <th className="text-right py-3 px-4 font-semibold min-w-[7.5rem]">Cliques</th>
                    <th className="text-right py-3 px-4 font-semibold min-w-[7.5rem]">CTR</th>
                    <th className="text-right py-3 px-4 font-semibold min-w-[7.5rem]">CPM</th>
                    <th className="text-right py-3 px-4 font-semibold min-w-[7.5rem]">CPC</th>
                    <th className="text-right py-3 px-4 font-semibold min-w-[7.5rem]">Engajamentos</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((creative, index) => {
                    const mediaData = googleDriveApi.findMediaForCreative(creative.promotedPinName, creativeMedias)

                    return (
                      <tr key={`${creative.adId}-${index}`} className={index % 2 === 0 ? "bg-red-50" : "bg-white"}>
                        <td className="py-3 px-4 w-[5rem]">
                          <MediaThumbnail
                            mediaData={mediaData}
                            creativeName={creative.promotedPinName}
                            isLoading={mediasLoading}
                            size="md"
                            onClick={() => openCreativeModal(creative)}
                          />
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-gray-900 text-sm leading-tight whitespace-normal break-words">
                              {creative.promotedPinName}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">{truncateText(creative.campaignName, 40)}</p>
                            <p className="text-xs text-gray-400 mt-1">ID: {creative.adId}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-semibold min-w-[7.5rem]">
                          {formatCurrency(creative.cost)}
                        </td>
                        <td className="py-3 px-4 text-right min-w-[7.5rem]">{formatNumber(creative.impressions)}</td>
                        <td className="py-3 px-4 text-right min-w-[7.5rem]">{formatNumber(creative.clicks)}</td>
                        <td className="py-3 px-4 text-right min-w-[7.5rem]">{creative.ctr.toFixed(2)}%</td>
                        <td className="py-3 px-4 text-right min-w-[7.5rem]">{formatCurrency(creative.cpm)}</td>
                        <td className="py-3 px-4 text-right min-w-[7.5rem]">{formatCurrency(creative.cpc)}</td>
                        <td className="py-3 px-4 text-right min-w-[7.5rem]">{formatNumber(creative.engagements)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-500">
                Mostrando {(currentPage - 1) * itemsPerPage + 1} -{" "}
                {Math.min(currentPage * itemsPerPage, filteredData.length)} de {filteredData.length} pins
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
          </>
        )}
      </div>

      {/* Modal do Criativo */}
      <CreativeModal 
        creative={selectedCreative}
        isOpen={isModalOpen}
        onClose={closeCreativeModal}
      />
    </div>
  )
}

export default CriativosPinterest
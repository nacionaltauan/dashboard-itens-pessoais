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
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
    { date: "2025-08-27", keyword: "seguro celular", impressions: 18, clicks: 0, ctr: 0, cost: 0 },
    { date: "2025-08-27", keyword: "seguro de bolsa", impressions: 1, clicks: 0, ctr: 0, cost: 0 },
    { date: "2025-08-27", keyword: "seguros pessoais", impressions: 1, clicks: 0, ctr: 0, cost: 0 },
    { date: "2025-08-27", keyword: "seguro de itens pessoais", impressions: 5, clicks: 0, ctr: 0, cost: 0 },
    { date: "2025-08-28", keyword: "itens pessoais", impressions: 6, clicks: 1, ctr: 16.67, cost: 4.5 },
    { date: "2025-08-28", keyword: "melhor seguro pessoal", impressions: 4, clicks: 0, ctr: 0, cost: 0 },
    { date: "2025-08-28", keyword: "seguro celular", impressions: 1229, clicks: 35, ctr: 2.85, cost: 157.5 },
    { date: "2025-08-28", keyword: "seguro de bolsa", impressions: 12, clicks: 0, ctr: 0, cost: 0 },
    { date: "2025-08-28", keyword: "seguro de celular casas bahia como funciona", impressions: 2, clicks: 0, ctr: 0, cost: 0 },
    { date: "2025-08-28", keyword: "seguro do celular como funciona", impressions: 6, clicks: 0, ctr: 0, cost: 0 },
    { date: "2025-08-28", keyword: "seguros pessoais", impressions: 140, clicks: 5, ctr: 3.57, cost: 22.5 },
    { date: "2025-08-28", keyword: "seguro celular", impressions: 1, clicks: 0, ctr: 0, cost: 0 },
    { date: "2025-08-28", keyword: "seguro de itens pessoais", impressions: 21, clicks: 0, ctr: 0, cost: 0 },
    { date: "2025-08-28", keyword: "seguro do celular como funciona", impressions: 2, clicks: 0, ctr: 0, cost: 0 },
    { date: "2025-08-29", keyword: "bb seguro itens pessoais", impressions: 1, clicks: 0, ctr: 0, cost: 0 },
    { date: "2025-08-29", keyword: "itens pessoais", impressions: 3, clicks: 0, ctr: 0, cost: 0 },
    { date: "2025-08-29", keyword: "melhor seguro pessoal", impressions: 27, clicks: 2, ctr: 7.41, cost: 9 },
    { date: "2025-08-29", keyword: "seguro celular", impressions: 788, clicks: 24, ctr: 3.05, cost: 108 },
    { date: "2025-08-29", keyword: "seguro de bolsa", impressions: 7, clicks: 1, ctr: 14.29, cost: 4.5 },
    { date: "2025-08-29", keyword: "seguro de celular", impressions: 2, clicks: 0, ctr: 0, cost: 0 },
    { date: "2025-08-29", keyword: "seguro de celular contra roubo", impressions: 1, clicks: 0, ctr: 0, cost: 0 },
    { date: "2025-08-29", keyword: "seguro de celular da havan", impressions: 1, clicks: 0, ctr: 0, cost: 0 },
    { date: "2025-08-29", keyword: "seguro de celular da magazine luiza", impressions: 1, clicks: 0, ctr: 0, cost: 0 },
    { date: "2025-08-29", keyword: "seguro de celular do governo", impressions: 46, clicks: 4, ctr: 8.70, cost: 18 },
    { date: "2025-08-29", keyword: "seguro de celular nubank", impressions: 1, clicks: 0, ctr: 0, cost: 0 },
    { date: "2025-08-29", keyword: "seguro do celular", impressions: 6, clicks: 1, ctr: 16.67, cost: 4.5 },
    { date: "2025-08-29", keyword: "seguro do celular como funciona", impressions: 51, clicks: 2, ctr: 3.92, cost: 9 },
    { date: "2025-08-29", keyword: "seguro pessoais", impressions: 14, clicks: 0, ctr: 0, cost: 0 },
    { date: "2025-08-29", keyword: "seguros pessoais", impressions: 122, clicks: 1, ctr: 0.82, cost: 4.5 },
    { date: "2025-08-29", keyword: "seguro de itens pessoais", impressions: 3, clicks: 0, ctr: 0, cost: 0 },
    { date: "2025-08-30", keyword: "bb seguro itens pessoais", impressions: 6, clicks: 0, ctr: 0, cost: 0 },
    { date: "2025-08-30", keyword: "itens pessoais", impressions: 4, clicks: 0, ctr: 0, cost: 0 },
    { date: "2025-08-30", keyword: "melhor seguro pessoal", impressions: 24, clicks: 2, ctr: 8.33, cost: 9 },
    { date: "2025-08-30", keyword: "seguro celular", impressions: 1203, clicks: 66, ctr: 5.49, cost: 297 },
    { date: "2025-08-30", keyword: "seguro de bolsa", impressions: 7, clicks: 0, ctr: 0, cost: 0 },
    { date: "2025-08-30", keyword: "seguro de celular", impressions: 5, clicks: 0, ctr: 0, cost: 0 },
    { date: "2025-08-30", keyword: "seguro de celular contra roubo", impressions: 73, clicks: 0, ctr: 0, cost: 0 },
    { date: "2025-08-30", keyword: "seguro de celular da magazine luiza", impressions: 1, clicks: 0, ctr: 0, cost: 0 },
    { date: "2025-08-30", keyword: "seguro de celular do governo", impressions: 39, clicks: 4, ctr: 10.26, cost: 18 },
    { date: "2025-08-30", keyword: "seguro do celular", impressions: 30, clicks: 1, ctr: 3.33, cost: 4.5 },
    { date: "2025-08-30", keyword: "seguro do celular como funciona", impressions: 38, clicks: 1, ctr: 2.63, cost: 4.5 },
    { date: "2025-08-30", keyword: "seguro pessoais", impressions: 21, clicks: 0, ctr: 0, cost: 0 },
    { date: "2025-08-30", keyword: "seguros pessoais", impressions: 144, clicks: 21, ctr: 14.58, cost: 94.5 },
    { date: "2025-08-31", keyword: "bb seguro itens pessoais", impressions: 4, clicks: 0, ctr: 0, cost: 0 },
    { date: "2025-08-31", keyword: "melhor seguro pessoal", impressions: 89, clicks: 12, ctr: 13.48, cost: 54 },
    { date: "2025-08-31", keyword: "seguro bolsa protegida", impressions: 1, clicks: 0, ctr: 0, cost: 0 },
    { date: "2025-08-31", keyword: "seguro celular", impressions: 1456, clicks: 73, ctr: 5.01, cost: 328.5 },
    { date: "2025-08-31", keyword: "seguro de bolsa", impressions: 1, clicks: 0, ctr: 0, cost: 0 },
    { date: "2025-08-31", keyword: "seguro de celular", impressions: 103, clicks: 7, ctr: 6.80, cost: 31.5 },
    { date: "2025-08-31", keyword: "seguro de celular contra roubo", impressions: 45, clicks: 0, ctr: 0, cost: 0 },
    { date: "2025-08-31", keyword: "seguro de celular do governo", impressions: 9, clicks: 0, ctr: 0, cost: 0 },
    { date: "2025-08-31", keyword: "seguro do celular", impressions: 19, clicks: 3, ctr: 15.79, cost: 13.5 },
    { date: "2025-08-31", keyword: "seguro do celular como funciona", impressions: 10, clicks: 0, ctr: 0, cost: 0 },
    { date: "2025-08-31", keyword: "seguro pessoais", impressions: 11, clicks: 1, ctr: 9.09, cost: 4.5 },
    { date: "2025-08-31", keyword: "seguros pessoais", impressions: 1981, clicks: 193, ctr: 9.74, cost: 868.5 },
    { date: "2025-09-01", keyword: "bb seguro itens pessoais", impressions: 21, clicks: 1, ctr: 4.76, cost: 4.5 },
    { date: "2025-09-01", keyword: "itens pessoais", impressions: 2, clicks: 0, ctr: 0, cost: 0 },
    { date: "2025-09-01", keyword: "melhor seguro pessoal", impressions: 1023, clicks: 121, ctr: 11.83, cost: 544.5 },
    { date: "2025-09-01", keyword: "seguro bolsa protegida", impressions: 10, clicks: 0, ctr: 0, cost: 0 },
    { date: "2025-09-01", keyword: "seguro celular", impressions: 727, clicks: 54, ctr: 7.43, cost: 243 },
    { date: "2025-09-01", keyword: "seguro contra roubo", impressions: 43, clicks: 7, ctr: 16.28, cost: 31.5 },
    { date: "2025-09-01", keyword: "seguro de bolsa", impressions: 1, clicks: 0, ctr: 0, cost: 0 },
    { date: "2025-09-01", keyword: "seguro de celular", impressions: 53, clicks: 7, ctr: 13.21, cost: 31.5 },
    { date: "2025-09-01", keyword: "seguro de celular contra roubo", impressions: 53, clicks: 0, ctr: 0, cost: 0 },
    { date: "2025-09-01", keyword: "seguro de celular do governo", impressions: 20, clicks: 3, ctr: 15.00, cost: 13.5 },
    { date: "2025-09-01", keyword: "seguro de roubo de celular", impressions: 11, clicks: 0, ctr: 0, cost: 0 },
    { date: "2025-09-01", keyword: "seguro do celular", impressions: 270, clicks: 60, ctr: 22.22, cost: 270 },
    { date: "2025-09-01", keyword: "seguro do celular como funciona", impressions: 27, clicks: 0, ctr: 0, cost: 0 },
    { date: "2025-09-01", keyword: "seguro pessoais", impressions: 18, clicks: 1, ctr: 5.56, cost: 4.5 },
    { date: "2025-09-01", keyword: "seguros pessoais", impressions: 1137, clicks: 153, ctr: 13.46, cost: 688.5 },
    { date: "2025-09-02", keyword: "bb seguro itens pessoais", impressions: 2, clicks: 0, ctr: 0, cost: 0 },
    { date: "2025-09-02", keyword: "melhor seguro pessoal", impressions: 812, clicks: 96, ctr: 11.82, cost: 432 },
    { date: "2025-09-02", keyword: "seguro bolsa protegida", impressions: 10, clicks: 0, ctr: 0, cost: 0 },
    { date: "2025-09-02", keyword: "seguro celular", impressions: 479, clicks: 35, ctr: 7.31, cost: 157.5 },
    { date: "2025-09-02", keyword: "seguro contra roubo", impressions: 42, clicks: 7, ctr: 16.67, cost: 31.5 },
    { date: "2025-09-02", keyword: "seguro de celular", impressions: 68, clicks: 16, ctr: 23.53, cost: 72 },
    { date: "2025-09-02", keyword: "seguro de celular contra roubo", impressions: 17, clicks: 0, ctr: 0, cost: 0 },
    { date: "2025-09-02", keyword: "seguro de celular do governo", impressions: 13, clicks: 0, ctr: 0, cost: 0 },
    { date: "2025-09-02", keyword: "seguro de roubo de celular", impressions: 34, clicks: 3, ctr: 8.82, cost: 13.5 },
    { date: "2025-09-02", keyword: "seguro do celular", impressions: 33, clicks: 5, ctr: 15.15, cost: 22.5 },
    { date: "2025-09-02", keyword: "seguro do celular como funciona", impressions: 11, clicks: 0, ctr: 0, cost: 0 },
    { date: "2025-09-02", keyword: "seguro pessoais", impressions: 16, clicks: 3, ctr: 18.75, cost: 13.5 },
    { date: "2025-09-02", keyword: "seguros pessoais", impressions: 510, clicks: 39, ctr: 7.65, cost: 175.5 },
    { date: "2025-09-03", keyword: "bb seguro itens pessoais", impressions: 10, clicks: 0, ctr: 0, cost: 0 },
    { date: "2025-09-03", keyword: "melhor seguro pessoal", impressions: 448, clicks: 42, ctr: 9.38, cost: 189 },
    { date: "2025-09-03", keyword: "seguro bolsa protegida", impressions: 2, clicks: 0, ctr: 0, cost: 0 },
    { date: "2025-09-03", keyword: "seguro celular", impressions: 223, clicks: 15, ctr: 6.73, cost: 67.5 },
    { date: "2025-09-03", keyword: "seguro contra roubo", impressions: 21, clicks: 1, ctr: 4.76, cost: 4.5 },
    { date: "2025-09-03", keyword: "seguro de celular", impressions: 4, clicks: 0, ctr: 0, cost: 0 },
    { date: "2025-09-03", keyword: "seguro de celular contra roubo", impressions: 14, clicks: 0, ctr: 0, cost: 0 },
    { date: "2025-09-03", keyword: "seguro de celular do governo", impressions: 12, clicks: 0, ctr: 0, cost: 0 },
    { date: "2025-09-03", keyword: "seguro de roubo de celular", impressions: 114, clicks: 8, ctr: 7.02, cost: 36 },
    { date: "2025-09-03", keyword: "seguro do celular", impressions: 80, clicks: 3, ctr: 3.75, cost: 13.5 },
    { date: "2025-09-03", keyword: "seguro do celular como funciona", impressions: 16, clicks: 2, ctr: 12.50, cost: 9 },
    { date: "2025-09-03", keyword: "seguro pessoais", impressions: 6, clicks: 0, ctr: 0, cost: 0 },
    { date: "2025-09-03", keyword: "seguros pessoais", impressions: 616, clicks: 55, ctr: 8.93, cost: 247.5 },
    { date: "2025-09-04", keyword: "bb seguro itens pessoais", impressions: 5, clicks: 0, ctr: 0, cost: 0 },
    { date: "2025-09-04", keyword: "melhor seguro pessoal", impressions: 223, clicks: 12, ctr: 5.38, cost: 54 },
    { date: "2025-09-04", keyword: "seguro bolsa protegida", impressions: 2, clicks: 1, ctr: 50.00, cost: 4.5 },
    { date: "2025-09-04", keyword: "seguro cartao", impressions: 1, clicks: 0, ctr: 0, cost: 0 },
    { date: "2025-09-04", keyword: "seguro celular", impressions: 159, clicks: 5, ctr: 3.14, cost: 22.5 },
    { date: "2025-09-04", keyword: "seguro contra roubo", impressions: 16, clicks: 0, ctr: 0, cost: 0 },
    { date: "2025-09-04", keyword: "seguro de celular", impressions: 32, clicks: 1, ctr: 3.13, cost: 4.5 },
    { date: "2025-09-04", keyword: "seguro de celular contra roubo", impressions: 19, clicks: 0, ctr: 0, cost: 0 },
    { date: "2025-09-04", keyword: "seguro de celular do governo", impressions: 3, clicks: 0, ctr: 0, cost: 0 },
    { date: "2025-09-04", keyword: "seguro de celular para iphone", impressions: 2, clicks: 0, ctr: 0, cost: 0 },
    { date: "2025-09-04", keyword: "seguro de roubo de celular", impressions: 35, clicks: 3, ctr: 8.57, cost: 13.5 },
    { date: "2025-09-04", keyword: "seguro do celular", impressions: 22, clicks: 1, ctr: 4.55, cost: 4.5 },
    { date: "2025-09-04", keyword: "seguro do celular como funciona", impressions: 11, clicks: 0, ctr: 0, cost: 0 },
    { date: "2025-09-04", keyword: "seguro pessoais", impressions: 16, clicks: 0, ctr: 0, cost: 0 },
    { date: "2025-09-04", keyword: "seguros pessoais", impressions: 321, clicks: 47, ctr: 14.64, cost: 211.5 },
    { date: "2025-09-05", keyword: "bb seguro itens pessoais", impressions: 3, clicks: 0, ctr: 0, cost: 0 },
    { date: "2025-09-05", keyword: "itens pessoais", impressions: 5, clicks: 0, ctr: 0, cost: 0 },
    { date: "2025-09-05", keyword: "melhor seguro pessoal", impressions: 254, clicks: 14, ctr: 5.51, cost: 63 },
    { date: "2025-09-05", keyword: "seguro bolsa protegida", impressions: 9, clicks: 0, ctr: 0, cost: 0 },
    { date: "2025-09-05", keyword: "seguro celular", impressions: 174, clicks: 6, ctr: 3.45, cost: 27 },
    { date: "2025-09-05", keyword: "seguro contra roubo", impressions: 592, clicks: 30, ctr: 5.07, cost: 135 },
    { date: "2025-09-05", keyword: "seguro de celular", impressions: 8, clicks: 0, ctr: 0, cost: 0 },
    { date: "2025-09-05", keyword: "seguro de celular contra roubo", impressions: 9, clicks: 0, ctr: 0, cost: 0 },
    { date: "2025-09-05", keyword: "seguro de celular do governo", impressions: 4, clicks: 0, ctr: 0, cost: 0 },
    { date: "2025-09-05", keyword: "seguro de roubo de celular", impressions: 69, clicks: 2, ctr: 2.90, cost: 9 },
    { date: "2025-09-05", keyword: "seguro do celular", impressions: 18, clicks: 1, ctr: 5.56, cost: 4.5 },
    { date: "2025-09-05", keyword: "seguro do celular como funciona", impressions: 19, clicks: 0, ctr: 0, cost: 0 },
    { date: "2025-09-05", keyword: "seguro pessoais", impressions: 33, clicks: 1, ctr: 3.03, cost: 4.5 },
    { date: "2025-09-05", keyword: "seguros pessoais", impressions: 326, clicks: 14, ctr: 4.29, cost: 63 },
    { date: "2025-09-06", keyword: "itens pessoais", impressions: 15, clicks: 0, ctr: 0, cost: 0 },
    { date: "2025-09-06", keyword: "melhor seguro pessoal", impressions: 455, clicks: 31, ctr: 6.81, cost: 139.5 },
    { date: "2025-09-06", keyword: "seguro bolsa protegida", impressions: 7, clicks: 0, ctr: 0, cost: 0 },
    { date: "2025-09-06", keyword: "seguro celular", impressions: 292, clicks: 13, ctr: 4.45, cost: 58.5 },
    { date: "2025-09-06", keyword: "seguro contra roubo", impressions: 605, clicks: 10, ctr: 1.65, cost: 45 },
    { date: "2025-09-06", keyword: "seguro de celular", impressions: 36, clicks: 4, ctr: 11.11, cost: 18 },
    { date: "2025-09-06", keyword: "seguro de celular contra roubo", impressions: 10, clicks: 0, ctr: 0, cost: 0 },
    { date: "2025-09-06", keyword: "seguro de celular do governo", impressions: 4, clicks: 0, ctr: 0, cost: 0 },
    { date: "2025-09-06", keyword: "seguro de roubo de celular", impressions: 117, clicks: 9, ctr: 7.69, cost: 40.5 },
    { date: "2025-09-06", keyword: "seguro do celular", impressions: 5, clicks: 0, ctr: 0, cost: 0 },
    { date: "2025-09-06", keyword: "seguro do celular como funciona", impressions: 16, clicks: 0, ctr: 0, cost: 0 },
    { date: "2025-09-06", keyword: "seguro pessoais", impressions: 61, clicks: 4, ctr: 6.56, cost: 18 },
    { date: "2025-09-06", keyword: "seguros pessoais", impressions: 286, clicks: 13, ctr: 4.55, cost: 58.5 },
    { date: "2025-09-07", keyword: "itens pessoais", impressions: 15, clicks: 0, ctr: 0, cost: 0 },
    { date: "2025-09-07", keyword: "melhor seguro pessoal", impressions: 193, clicks: 14, ctr: 7.25, cost: 63 },
    { date: "2025-09-07", keyword: "seguro bolsa protegida", impressions: 2, clicks: 0, ctr: 0, cost: 0 },
    { date: "2025-09-07", keyword: "seguro celular", impressions: 198, clicks: 2, ctr: 1.01, cost: 9 },
    { date: "2025-09-07", keyword: "seguro contra roubo", impressions: 739, clicks: 29, ctr: 3.92, cost: 130.5 },
    { date: "2025-09-07", keyword: "seguro de celular", impressions: 33, clicks: 0, ctr: 0, cost: 0 },
    { date: "2025-09-07", keyword: "seguro de celular contra roubo", impressions: 11, clicks: 0, ctr: 0, cost: 0 },
    { date: "2025-09-07", keyword: "seguro de celular do governo", impressions: 2, clicks: 0, ctr: 0, cost: 0 },
    { date: "2025-09-07", keyword: "seguro de roubo de celular", impressions: 82, clicks: 12, ctr: 14.63, cost: 54 },
    { date: "2025-09-07", keyword: "seguro do celular", impressions: 5, clicks: 0, ctr: 0, cost: 0 },
    { date: "2025-09-07", keyword: "seguro do celular como funciona", impressions: 14, clicks: 0, ctr: 0, cost: 0 },
    { date: "2025-09-07", keyword: "seguro pessoais", impressions: 28, clicks: 1, ctr: 3.57, cost: 4.5 },
    { date: "2025-09-07", keyword: "seguros pessoais", impressions: 325, clicks: 33, ctr: 10.15, cost: 148.5 },
    { date: "2025-09-08", keyword: "bb seguro itens pessoais", impressions: 16, clicks: 0, ctr: 0, cost: 0 },
    { date: "2025-09-08", keyword: "itens pessoais", impressions: 5, clicks: 0, ctr: 0, cost: 0 },
    { date: "2025-09-08", keyword: "melhor seguro pessoal", impressions: 377, clicks: 28, ctr: 7.43, cost: 126 },
    { date: "2025-09-08", keyword: "seguro bolsa protegida", impressions: 7, clicks: 0, ctr: 0, cost: 0 },
    { date: "2025-09-08", keyword: "seguro celular", impressions: 225, clicks: 7, ctr: 3.11, cost: 31.5 },
    { date: "2025-09-08", keyword: "seguro contra roubo", impressions: 1888, clicks: 62, ctr: 3.28, cost: 279 },
    { date: "2025-09-08", keyword: "seguro de celular", impressions: 45, clicks: 0, ctr: 0, cost: 0 },
    { date: "2025-09-08", keyword: "seguro de celular contra roubo", impressions: 8, clicks: 0, ctr: 0, cost: 0 },
    { date: "2025-09-08", keyword: "seguro de celular do governo", impressions: 2, clicks: 0, ctr: 0, cost: 0 },
    { date: "2025-09-08", keyword: "seguro de roubo de celular", impressions: 52, clicks: 4, ctr: 7.69, cost: 18 },
    { date: "2025-09-08", keyword: "seguro do celular", impressions: 19, clicks: 0, ctr: 0, cost: 0 },
    { date: "2025-09-08", keyword: "seguro do celular como funciona", impressions: 16, clicks: 0, ctr: 0, cost: 0 },
    { date: "2025-09-08", keyword: "seguro pessoais", impressions: 156, clicks: 15, ctr: 9.62, cost: 67.5 },
    { date: "2025-09-08", keyword: "seguros pessoais", impressions: 533, clicks: 45, ctr: 8.44, cost: 202.5 },
];

const GoogleSearchKeywords: React.FC = () => {
  const contentRef = useRef<HTMLDivElement>(null)
  
  // Estado para os dados processados, inicializado com os dados estáticos
  const [processedData] = useState<KeywordData[]>(staticKeywordData)
  
  // Estado para o intervalo de datas do filtro
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: "2025-08-27", end: "2025-09-04" });
  
  // Estado para a paginação da tabela
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

// Memoização para filtrar E AGREGAR os dados
const filteredData = useMemo(() => {
  let filtered = processedData;

  // 1. Filtragem por data (lógica mantida)
  if (dateRange.start && dateRange.end) {
    filtered = filtered.filter((item) => {
      const itemDate = new Date(item.date);
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      endDate.setDate(endDate.getDate() + 1); // Incluir o dia final
      return itemDate >= startDate && itemDate < endDate;
    });
  }

  // 2. Agrupamento dos dados por palavra-chave
  const groupedData: Record<string, { cost: number; impressions: number; clicks: number }> = {};

  filtered.forEach((item) => {
    // Se a palavra-chave ainda não estiver no nosso objeto de grupo, inicializa-a
    if (!groupedData[item.keyword]) {
      groupedData[item.keyword] = {
        cost: 0,
        impressions: 0,
        clicks: 0,
      };
    }
    // Soma os valores
    groupedData[item.keyword].cost += item.cost;
    groupedData[item.keyword].impressions += item.impressions;
    groupedData[item.keyword].clicks += item.clicks;
  });

  // 3. Transformação do objeto agrupado num array e cálculo do CTR
  const finalData = Object.keys(groupedData).map((keyword) => {
    const data = groupedData[keyword];
    return {
      keyword: keyword,
      cost: data.cost,
      impressions: data.impressions,
      clicks: data.clicks,
      // Recalcula o CTR com base nos totais
      ctr: data.impressions > 0 ? (data.clicks / data.impressions) * 100 : 0,
    };
  });

    // Ordena os dados por custo, do maior para o menor
    finalData.sort((a, b) => b.cost - a.cost);

    return finalData;
  }, [processedData, dateRange]);

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
              {/* Cabeçalho da tabela modificado */}
              <tr className="bg-blue-600 text-white">
                <th className="text-left py-3 px-4 font-semibold">Palavras-chave</th>
                <th className="text-right py-3 px-4 font-semibold">Investimento</th>
                <th className="text-right py-3 px-4 font-semibold">Impressões</th>
                <th className="text-right py-3 px-4 font-semibold">Cliques</th>
                <th className="text-right py-3 px-4 font-semibold">CTR</th>
              </tr>
            </thead>
            <tbody>
              {/* Corpo da tabela modificado */}
              {paginatedData.map((keyword, index) => (
                <tr key={index} className={index % 2 === 0 ? "bg-blue-50" : "bg-white"}>
                  {/* Célula da data removida */}
                  <td className="py-3 px-4 font-medium text-gray-900 text-sm">{keyword.keyword}</td>
                  <td className="py-3 px-4 text-right font-semibold">{formatCurrency(keyword.cost)}</td>
                  <td className="py-3 px-4 text-right">{formatNumber(keyword.impressions)}</td>
                  <td className="py-3 px-4 text-right">{formatNumber(keyword.clicks)}</td>
                  {/* O CTR agora vem do novo cálculo */}
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
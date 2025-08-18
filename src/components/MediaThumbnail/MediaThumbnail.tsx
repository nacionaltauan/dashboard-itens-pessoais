import React, { useState } from 'react'
import { Play, AlertCircle, Eye } from 'lucide-react'

interface MediaThumbnailProps {
  mediaData?: { url: string; type: string } | null
  creativeName: string
  isLoading?: boolean
  className?: string
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void // Nova prop para clique
}

const MediaThumbnail: React.FC<MediaThumbnailProps> = ({
  mediaData,
  creativeName,
  isLoading = false,
  className = '',
  size = 'md',
  onClick
}) => {
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-24 h-24'
  }

  // Estados de loading
  if (isLoading) {
    return (
      <div className={`${sizeClasses[size]} rounded-lg bg-gray-100 flex items-center justify-center ${className}`}>
        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-400"></div>
      </div>
    )
  }

  // Estado de erro ou sem mídia
  if (!mediaData || imageError) {
    return (
      <div className={`${sizeClasses[size]} rounded-lg bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center ${className} ${onClick ? 'cursor-pointer hover:bg-gray-100' : ''}`}
           onClick={onClick}>
        <AlertCircle className="w-4 h-4 text-gray-300" />
        <span className="text-[8px] text-gray-300 text-center mt-1">
          Sem mídia
        </span>
      </div>
    )
  }

  const handleImageError = () => {
    setImageError(true)
  }

  const handleImageLoad = () => {
    setImageLoaded(true)
  }

  // Renderização para vídeos
  if (mediaData.type === 'video') {
    return (
      <div className={`${sizeClasses[size]} rounded-lg overflow-hidden bg-gray-100 relative ${className} group ${onClick ? 'cursor-pointer' : ''}`}
           onClick={onClick}>
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-400"></div>
          </div>
        )}
        <iframe
          src={mediaData.url}
          className="w-full h-full border-0 pointer-events-none"
          title={`Vídeo: ${creativeName}`}
          onLoad={handleImageLoad}
          onError={handleImageError}
          style={{ 
            display: imageError ? 'none' : 'block',
            opacity: imageLoaded ? 1 : 0,
            transition: 'opacity 0.2s ease'
          }}
          allow="autoplay; encrypted-media"
        />
        {/* Overlay com ícones - aparece no hover */}
        {imageLoaded && onClick && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black bg-opacity-40">
            <div className="flex items-center space-x-2">
              <div className="bg-white bg-opacity-90 rounded-full p-2 shadow-sm">
                <Play className="w-4 h-4 text-gray-700 fill-gray-700" />
              </div>
              <div className="bg-white bg-opacity-90 rounded-full p-2 shadow-sm">
                <Eye className="w-4 h-4 text-gray-700" />
              </div>
            </div>
          </div>
        )}
        {/* Indicador de play discreto - sempre visível */}
        {imageLoaded && !onClick && (
          <div className="absolute bottom-1 right-1 opacity-80">
            <div className="bg-black bg-opacity-70 rounded-full p-1">
              <Play className="w-2 h-2 text-white fill-white" />
            </div>
          </div>
        )}
      </div>
    )
  }

  // Renderização para imagens
  return (
    <div className={`${sizeClasses[size]} rounded-lg overflow-hidden bg-gray-100 relative ${className} group ${onClick ? 'cursor-pointer' : ''}`}
         onClick={onClick}>
      {!imageLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-400"></div>
        </div>
      )}
      <iframe
        src={mediaData.url}
        className="w-full h-full border-0 pointer-events-none"
        title={`Imagem: ${creativeName}`}
        onLoad={handleImageLoad}
        onError={handleImageError}
        style={{ 
          display: imageError ? 'none' : 'block',
          opacity: imageLoaded ? 1 : 0,
          transition: 'opacity 0.2s ease'
        }}
        allow="autoplay; encrypted-media"
      />
      {/* Overlay no hover para imagens - só se clicável */}
      {imageLoaded && onClick && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black bg-opacity-20">
          <div className="bg-white bg-opacity-90 rounded-full p-2 shadow-sm">
            <Eye className="w-4 h-4 text-gray-700" />
          </div>
        </div>
      )}
    </div>
  )
}

export default MediaThumbnail
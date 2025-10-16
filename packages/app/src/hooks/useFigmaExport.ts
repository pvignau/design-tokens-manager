import { useState, useCallback } from 'react'
import { FigmaExporter, type FigmaConfig } from '../utils/figmaExport'
import type { TokenWithId } from '../types/tokens'

export const useFigmaExport = () => {
  const [isExporting, setIsExporting] = useState(false)
  const [figmaConfig, setFigmaConfig] = useState<FigmaConfig | null>(() => {
    // Try to load from localStorage
    const saved = localStorage.getItem('figma-config')
    return saved ? JSON.parse(saved) : null
  })

  const updateConfig = useCallback((config: FigmaConfig) => {
    setFigmaConfig(config)
    localStorage.setItem('figma-config', JSON.stringify(config))
  }, [])

  const clearConfig = useCallback(() => {
    setFigmaConfig(null)
    localStorage.removeItem('figma-config')
  }, [])

  const exportToFigma = useCallback(async (tokens: TokenWithId[]) => {
    if (!figmaConfig) {
      throw new Error('Figma configuration is required')
    }

    if (tokens.length === 0) {
      throw new Error('No tokens to export')
    }

    setIsExporting(true)
    try {
      const exporter = new FigmaExporter(figmaConfig)
      const result = await exporter.exportTokensToFigma(tokens, figmaConfig.collectionId)
      return result
    } finally {
      setIsExporting(false)
    }
  }, [figmaConfig])

  const isConfigured = figmaConfig !== null

  return {
    figmaConfig,
    updateConfig,
    clearConfig,
    exportToFigma,
    isExporting,
    isConfigured,
  }
}
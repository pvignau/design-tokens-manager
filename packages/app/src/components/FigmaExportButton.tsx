import React, { useState } from 'react'
import { useFigmaExport } from '../hooks/useFigmaExport'
import type { TokenWithId } from '../types/tokens'

interface FigmaExportButtonProps {
  tokens: TokenWithId[]
  onExportStart?: () => void
  onExportComplete?: (result: any) => void
  onExportError?: (error: Error) => void
}

interface FigmaConfigModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (accessToken: string, fileKey: string, collectionId?: string) => void
  initialToken?: string
  initialFileKey?: string
  initialCollectionId?: string
}

const FigmaConfigModal: React.FC<FigmaConfigModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialToken = '',
  initialFileKey = '',
  initialCollectionId = '',
}) => {
  const [accessToken, setAccessToken] = useState(initialToken)
  const [fileKey, setFileKey] = useState(initialFileKey)
  const [collectionId, setCollectionId] = useState(initialCollectionId)

  if (!isOpen) return null

  const handleSave = () => {
    if (accessToken.trim() && fileKey.trim()) {
      onSave(accessToken.trim(), fileKey.trim(), collectionId.trim() || undefined)
      onClose()
    }
  }

  const extractFileKeyFromUrl = (url: string) => {
    const match = url.match(/figma\.com\/(?:file|design)\/([a-zA-Z0-9]{22,128})/)
    return match ? match[1] : url
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-500 rounded-full"></div>
          <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-blue-500 rounded-full"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-gradient-to-br from-purple-400 to-blue-400 rounded-full"></div>
        </div>
        
        {/* Content */}
        <div className="relative z-10">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Configure Figma Export</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Figma Access Token
              </label>
              <input
                type="password"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder="Enter your Figma personal access token"
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Get your token from Figma → Settings → Personal Access Tokens
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Figma File Key or URL
              </label>
              <input
                type="text"
                value={fileKey}
                onChange={(e) => setFileKey(extractFileKeyFromUrl(e.target.value))}
                placeholder="File key or paste Figma file URL"
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                File key from the URL: figma.com/file/[FILE_KEY]/...
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Variable Collection ID/Name (Optional)
              </label>
              <input
                type="text"
                value={collectionId}
                onChange={(e) => setCollectionId(e.target.value)}
                placeholder="Leave empty to use 'tslike' collection"
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave empty to auto-create/use "tslike" collection, or provide existing collection ID/name
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <p className="text-xs text-blue-800">
                <strong>Auto-collection:</strong> If no collection is specified, the app will automatically find or create a "tslike" collection for your tokens.
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <p className="text-xs text-yellow-800">
                <strong>Note:</strong> Figma Variables API requires an Enterprise plan and specific token scopes: 
                file_variables:read, file_variables:write, files:read.
              </p>
            </div>
          </div>

          <div className="flex gap-2 mt-6">
            <button
              onClick={handleSave}
              disabled={!accessToken.trim() || !fileKey.trim()}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save Configuration
            </button>
            <button
              onClick={onClose}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export const FigmaExportButton: React.FC<FigmaExportButtonProps> = ({
  tokens,
  onExportStart,
  onExportComplete,
  onExportError,
}) => {
  const { figmaConfig, updateConfig, clearConfig, exportToFigma, isExporting, isConfigured } = useFigmaExport()
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [showResultModal, setShowResultModal] = useState(false)
  const [exportResult, setExportResult] = useState<any>(null)

  const handleExport = async () => {
    if (!isConfigured) {
      setShowConfigModal(true)
      return
    }

    try {
      onExportStart?.()
      const result = await exportToFigma(tokens)
      setExportResult(result)
      setShowResultModal(true)
      onExportComplete?.(result)
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Export failed')
      onExportError?.(err)
      alert(`Export failed: ${err.message}`)
    }
  }

  const handleConfigSave = (accessToken: string, fileKey: string, collectionId?: string) => {
    updateConfig({ accessToken, fileKey, collectionId })
  }

  return (
    <>
      <button
        onClick={handleExport}
        disabled={isExporting || tokens.length === 0}
        className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C8.74 0 5.8 1.5 4.15 4.09L15.91 15.85C18.5 14.2 20 11.26 20 8C20 3.58 16.42 0 12 0Z"/>
          <path d="M4.09 19.85C5.74 22.5 8.68 24 12 24C16.42 24 20 20.42 20 16C20 12.74 18.5 9.8 15.91 8.15L4.09 19.85Z"/>
        </svg>
        {isExporting ? 'Exporting...' : isConfigured ? 'Export to Figma' : 'Configure Figma'}
      </button>

      <FigmaConfigModal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        onSave={handleConfigSave}
        initialToken={figmaConfig?.accessToken}
        initialFileKey={figmaConfig?.fileKey}
        initialCollectionId={figmaConfig?.collectionId}
      />

      {showResultModal && exportResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Results</h3>
            
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <p className="text-sm text-green-800">
                  <strong>Collection Created:</strong> {exportResult.collectionName}
                </p>
                <p className="text-sm text-green-800">
                  <strong>Total Tokens:</strong> {exportResult.summary.total}
                </p>
                <p className="text-sm text-green-800">
                  <strong>Successful:</strong> {exportResult.summary.successful}
                </p>
                {exportResult.summary.failed > 0 && (
                  <p className="text-sm text-red-800">
                    <strong>Failed:</strong> {exportResult.summary.failed}
                  </p>
                )}
              </div>

              {exportResult.results.some((r: any) => !r.success) && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Failed Tokens:</h4>
                  <div className="max-h-32 overflow-y-auto">
                    {exportResult.results
                      .filter((r: any) => !r.success)
                      .map((r: any, i: number) => (
                        <p key={i} className="text-sm text-red-600">
                          {r.token}: {r.error}
                        </p>
                      ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowResultModal(false)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Close
              </button>
              {isConfigured && (
                <button
                  onClick={() => {
                    clearConfig()
                    setShowResultModal(false)
                  }}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Clear Config
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
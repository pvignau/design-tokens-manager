import React, { useRef, useState } from 'react'
import { parseDTCGFile, validateDTCGFile } from '../utils/dtcgImport'
import type { TokenWithId } from '../types/tokens'

interface ImportButtonProps {
  onImport: (tokens: TokenWithId[], replaceAll?: boolean) => void
  onImportStart?: () => void
  onImportComplete?: (count: number) => void
  onImportError?: (error: Error) => void
}

interface ImportModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (tokens: TokenWithId[], replaceAll: boolean) => void
  tokens: TokenWithId[]
  fileName: string
}

const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  tokens,
  fileName
}) => {
  const [replaceAll, setReplaceAll] = useState(false)

  if (!isOpen) return null

  const tokensByType = tokens.reduce((acc, token) => {
    acc[token.$type] = (acc[token.$type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-lg w-full p-6 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-green-500 rounded-full"></div>
          <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-blue-500 rounded-full"></div>
        </div>
        
        {/* Content */}
        <div className="relative z-10">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Import Design Tokens</h3>
          
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <p className="text-sm text-blue-800">
                <strong>File:</strong> {fileName}
              </p>
              <p className="text-sm text-blue-800">
                <strong>Total Tokens:</strong> {tokens.length}
              </p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Token Types:</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(tokensByType).map(([type, count]) => (
                  <div key={type} className="flex justify-between bg-gray-50 px-2 py-1 rounded">
                    <span className="capitalize">{type}:</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-4">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={replaceAll}
                  onChange={(e) => setReplaceAll(e.target.checked)}
                  className="mt-0.5"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">
                    Replace all existing tokens
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    {replaceAll 
                      ? 'All current tokens will be replaced with imported ones'
                      : 'Imported tokens will be added to existing ones (duplicates may occur)'
                    }
                  </p>
                </div>
              </label>
            </div>
          </div>

          <div className="flex gap-2 mt-6">
            <button
              onClick={() => onConfirm(tokens, replaceAll)}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              Import Tokens
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

export const ImportButton: React.FC<ImportButtonProps> = ({
  onImport,
  onImportStart,
  onImportComplete,
  onImportError
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showModal, setShowModal] = useState(false)
  const [parsedTokens, setParsedTokens] = useState<TokenWithId[]>([])
  const [fileName, setFileName] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const handleFileSelect = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.json')) {
      onImportError?.(new Error('Please select a JSON file'))
      return
    }

    setIsProcessing(true)
    onImportStart?.()

    try {
      const content = await file.text()
      
      // Validate the file first
      const validation = validateDTCGFile(content)
      if (!validation.isValid) {
        throw new Error(validation.error || 'Invalid DTCG file')
      }

      // Parse the tokens
      const tokens = parseDTCGFile(content)
      
      if (tokens.length === 0) {
        throw new Error('No valid tokens found in the file')
      }

      setParsedTokens(tokens)
      setFileName(file.name)
      setShowModal(true)
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to process file')
      onImportError?.(err)
      alert(`Import failed: ${err.message}`)
    } finally {
      setIsProcessing(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleImportConfirm = (tokens: TokenWithId[], replaceAll: boolean) => {
    try {
      onImport(tokens, replaceAll)
      onImportComplete?.(tokens.length)
      setShowModal(false)
      setParsedTokens([])
      setFileName('')
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Import failed')
      onImportError?.(err)
      alert(`Import failed: ${err.message}`)
    }
  }

  const loadSampleFile = async () => {
    setIsProcessing(true)
    onImportStart?.()

    try {
      const response = await fetch('/sample-tokens.json')
      if (!response.ok) {
        throw new Error('Failed to load sample file')
      }
      
      const content = await response.text()
      const tokens = parseDTCGFile(content)
      
      setParsedTokens(tokens)
      setFileName('sample-tokens.json')
      setShowModal(true)
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to load sample')
      onImportError?.(err)
      alert(`Failed to load sample: ${err.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <>
      <div className="flex gap-2">
        <button
          onClick={handleFileSelect}
          disabled={isProcessing}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
          </svg>
          {isProcessing ? 'Processing...' : 'Import JSON'}
        </button>

        <button
          onClick={loadSampleFile}
          disabled={isProcessing}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Load Sample
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
      />

      <ImportModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setParsedTokens([])
          setFileName('')
        }}
        onConfirm={handleImportConfirm}
        tokens={parsedTokens}
        fileName={fileName}
      />
    </>
  )
}
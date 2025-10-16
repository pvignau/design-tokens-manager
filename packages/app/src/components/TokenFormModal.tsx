import React from 'react'
import { TokenForm } from './TokenForm'
import type { TokenWithId } from '../types/tokens'

interface TokenFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (token: Omit<TokenWithId, 'id'>) => void
  editToken?: TokenWithId | null
}

export const TokenFormModal: React.FC<TokenFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editToken
}) => {
  if (!isOpen) return null

  const handleSubmit = (token: Omit<TokenWithId, 'id'>) => {
    onSubmit(token)
    onClose()
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto relative">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500 rounded-full"></div>
          <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-purple-500 rounded-full"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full"></div>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-gray-400 hover:text-gray-600 transition-colors"
          title="Close modal"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Form content */}
        <div className="relative z-10 p-6">
          <TokenForm
            onSubmit={handleSubmit}
            editToken={editToken}
            onCancel={onClose}
          />
        </div>
      </div>
    </div>
  )
}
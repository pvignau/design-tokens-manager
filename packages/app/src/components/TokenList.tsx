import React from 'react'
import type { TokenWithId, TokenType } from '../types/tokens'
import { TokenCard } from './TokenCard'

interface TokenListProps {
  tokens: TokenWithId[]
  onEdit: (token: TokenWithId) => void
  onDelete: (id: string) => void
  selectedType?: TokenType | 'all'
}

export const TokenList: React.FC<TokenListProps> = ({ 
  tokens, 
  onEdit, 
  onDelete, 
  selectedType = 'all' 
}) => {
  const filteredTokens = selectedType === 'all' 
    ? tokens 
    : tokens.filter(token => token.$type === selectedType)

  if (filteredTokens.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        {selectedType === 'all' 
          ? 'No tokens created yet. Add your first token above!'
          : `No ${selectedType} tokens found.`
        }
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-3">
      {filteredTokens.map((token) => (
        <div key={token.id} className="flex-none w-80">
          <TokenCard
            token={token}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </div>
      ))}
    </div>
  )
}
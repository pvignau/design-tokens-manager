import React from 'react'
import type { TokenType } from '../types/tokens'

interface TypeFilterProps {
  selectedType: TokenType | 'all'
  onTypeChange: (type: TokenType | 'all') => void
  tokenCounts: Record<TokenType | 'all', number>
}

const TOKEN_TYPES: { value: TokenType | 'all'; label: string; icon: string }[] = [
  { value: 'all', label: 'All', icon: '∀' },
  { value: 'color', label: 'Color', icon: '🎨' },
  { value: 'dimension', label: 'Size', icon: '📏' },
  { value: 'fontFamily', label: 'Font', icon: '🔤' },
  { value: 'fontWeight', label: 'Weight', icon: '𝐁' },
  { value: 'duration', label: 'Time', icon: '⏱' },
  { value: 'cubicBezier', label: 'Curve', icon: '〰️' },
  { value: 'number', label: 'Num', icon: '#' },
  { value: 'strokeStyle', label: 'Stroke', icon: '✏️' },
  { value: 'border', label: 'Border', icon: '⬜' },
  { value: 'transition', label: 'Transit', icon: '⚡' },
  { value: 'shadow', label: 'Shadow', icon: '🌓' },
  { value: 'gradient', label: 'Grad', icon: '🌈' },
  { value: 'typography', label: 'Text', icon: '📝' },
]

export const TypeFilter: React.FC<TypeFilterProps> = ({
  selectedType,
  onTypeChange,
  tokenCounts,
}) => {
  return (
    <div>
      <div className="space-y-1">
        {TOKEN_TYPES.map(({ value, label, icon }) => {
          const count = tokenCounts[value] || 0
          const isSelected = selectedType === value
          
          return (
            <button
              key={value}
              onClick={() => onTypeChange(value)}
              title={label}
              className={`w-full flex items-center justify-between px-1 py-0.5 rounded text-xs transition-all duration-200 ${
                isSelected
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'hover:bg-gray-50 text-gray-700'
              }`}
            >
              <div className="flex items-center gap-1 min-w-0">
                <span className="text-xs">{icon}</span>
                <span className="truncate text-xs">{label}</span>
              </div>
              <span className={`text-xs px-1 rounded-full flex-shrink-0 ${
                isSelected 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-gray-100 text-gray-500'
              }`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
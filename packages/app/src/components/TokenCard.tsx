import React from 'react'
import type { TokenWithId } from '../types/tokens'

interface TokenCardProps {
  token: TokenWithId
  onEdit: (token: TokenWithId) => void
  onDelete: (id: string) => void
}

interface BaseTokenCardProps extends TokenCardProps {
  preview?: React.ReactNode
  children?: React.ReactNode
}

const BaseTokenCard: React.FC<BaseTokenCardProps> = ({
  token,
  onEdit,
  onDelete,
  preview,
  children
}) => {
  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // Simple notification - could be enhanced with a toast
      console.log(`${type} copied to clipboard: ${text}`)
    }).catch(err => {
      console.error('Failed to copy to clipboard:', err)
    })
  }

  const handleCopyName = () => {
    copyToClipboard(token.name, 'Token name')
  }

  const handleCopyValue = () => {
    const valueString = typeof token.$value === 'object' 
      ? JSON.stringify(token.$value) 
      : String(token.$value)
    copyToClipboard(valueString, 'Token value')
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <h3 className="text-sm font-medium text-gray-900 truncate">{token.name}</h3>
            <button
              onClick={handleCopyName}
              className="text-gray-400 hover:text-blue-600 p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
              title="Copy token name"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{token.$type}</p>
        </div>
        <div className="flex gap-1 ml-2">
          <button
            onClick={() => onEdit(token)}
            className="text-gray-400 hover:text-blue-600 p-1 rounded"
            title="Edit token"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(token.id)}
            className="text-gray-400 hover:text-red-600 p-1 rounded"
            title="Delete token"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Preview Section */}
      <div className="mb-3">
        {preview}
      </div>

      {/* Value Display */}
      <div className="relative">
        <div className="text-xs text-gray-600 bg-gray-50 rounded p-2 font-mono overflow-x-scroll whitespace-nowrap pr-8">
          {typeof token.$value === 'object' ? JSON.stringify(token.$value) : String(token.$value)}
        </div>
        <button
          onClick={handleCopyValue}
          className="absolute top-1 right-1 text-gray-400 hover:text-blue-600 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
          title="Copy token value"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>
      </div>

      {/* Description */}
      {token.$description && (
        <p className="text-xs text-gray-500 mt-2 italic">{token.$description}</p>
      )}

      {children}
    </div>
  )
}

export const ColorTokenCard: React.FC<TokenCardProps> = ({ token, onEdit, onDelete }) => {
  const colorValue = typeof token.$value === 'string' ? token.$value : '#000000'
  
  const preview = (
    <div className="flex items-center gap-2">
      <div 
        className="w-8 h-8 rounded border border-gray-300 flex-shrink-0"
        style={{ backgroundColor: colorValue }}
        title={colorValue}
      />
      <span className="text-sm font-medium text-gray-700">{colorValue}</span>
    </div>
  )
  
  return <BaseTokenCard token={token} onEdit={onEdit} onDelete={onDelete} preview={preview} />
}

export const DimensionTokenCard: React.FC<TokenCardProps> = ({ token, onEdit, onDelete }) => {
  const value = String(token.$value)
  
  // Check if this is a border radius token based on name
  if (token.name.toLowerCase().includes('radius') || token.name.toLowerCase().includes('border')) {
    return <BorderRadiusTokenCard token={token} onEdit={onEdit} onDelete={onDelete} />
  }
  
  // Check if this is an icon size token based on name
  if (token.name.toLowerCase().includes('icon') || token.name.toLowerCase().includes('size')) {
    return <IconSizeTokenCard token={token} onEdit={onEdit} onDelete={onDelete} />
  }
  
  // Extract numeric value for scaling (remove units like px, rem, etc.)
  const numericValue = parseFloat(value.replace(/[^\d.]/g, '')) || 16
  // Scale the spacing visually (cap between 4px and 40px for card constraints)
  const scaledWidth = Math.min(Math.max(numericValue * 2, 4), 40)
  
  const preview = (
    <div className="flex flex-col gap-2">
      {/* Spacing visualization */}
      <div className="flex items-center justify-center bg-gray-50 p-2 rounded">
        {/* Left element */}
        <div className="w-8 h-6 bg-blue-400 rounded-sm"></div>
        
        {/* Spacing (darker color representing the gap) */}
        <div 
          className="bg-blue-700"
          style={{ width: `${scaledWidth}px`, height: '24px' }}
        ></div>
        
        {/* Right element (same color as left) */}
        <div className="w-8 h-6 bg-blue-400 rounded-sm"></div>
      </div>
      
      {/* Value display */}
      <div className="text-center">
        <span className="text-sm font-medium text-gray-700">{value}</span>
      </div>
    </div>
  )
  
  return <BaseTokenCard token={token} onEdit={onEdit} onDelete={onDelete} preview={preview} />
}

export const IconSizeTokenCard: React.FC<TokenCardProps> = ({ token, onEdit, onDelete }) => {
  const value = String(token.$value)
  // Extract numeric value for the icon size
  const numericValue = parseFloat(value.replace(/[^\d.]/g, '')) || 16
  // Cap the size for display (max 32px to fit nicely in the card)
  const displaySize = Math.min(numericValue, 32)
  
  const preview = (
    <div className="flex flex-col gap-2">
      {/* Icon size visualization */}
      <div className="flex items-center justify-center bg-gray-50 p-4 rounded">
        {/* Dummy icon pattern using SVG */}
        <svg 
          width={displaySize} 
          height={displaySize} 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          className="text-blue-500"
          strokeWidth="2"
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          {/* Simple star icon pattern */}
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
        </svg>
      </div>
      
      {/* Value display */}
      <div className="text-center">
        <span className="text-sm font-medium text-gray-700">{value}</span>
      </div>
    </div>
  )
  
  return <BaseTokenCard token={token} onEdit={onEdit} onDelete={onDelete} preview={preview} />
}

export const BorderRadiusTokenCard: React.FC<TokenCardProps> = ({ token, onEdit, onDelete }) => {
  const value = String(token.$value)
  // Extract numeric value for the border radius
  const numericValue = parseFloat(value.replace(/[^\d.]/g, '')) || 8
  // Cap the radius for display (max 24px to fit nicely in the card)
  const displayRadius = Math.min(numericValue, 24)
  
  const preview = (
    <div className="flex flex-col gap-2">
      {/* Border radius visualization - top-left corner */}
      <div className="flex items-center justify-center bg-gray-50 p-4 rounded">
        <div 
          className="w-16 h-16 bg-transparent"
          style={{ 
            borderTop: '2px solid #3b82f6',
            borderLeft: '2px solid #3b82f6',
            borderRight: 'none',
            borderBottom: 'none',
            borderTopLeftRadius: `${displayRadius}px`,
          }}
        ></div>
      </div>
      
      {/* Value display */}
      <div className="text-center">
        <span className="text-sm font-medium text-gray-700">{value}</span>
      </div>
    </div>
  )
  
  return <BaseTokenCard token={token} onEdit={onEdit} onDelete={onDelete} preview={preview} />
}

export const FontFamilyTokenCard: React.FC<TokenCardProps> = ({ token, onEdit, onDelete }) => {
  const fontFamily = String(token.$value)
  
  const preview = (
    <div className="text-lg text-gray-700" style={{ fontFamily }}>
      Aa Bb Cc
    </div>
  )
  
  return <BaseTokenCard token={token} onEdit={onEdit} onDelete={onDelete} preview={preview} />
}

export const FontWeightTokenCard: React.FC<TokenCardProps> = ({ token, onEdit, onDelete }) => {
  const fontWeight = token.$value
  
  const preview = (
    <div className="text-lg text-gray-700" style={{ fontWeight: Number(fontWeight) }}>
      The quick brown fox
    </div>
  )
  
  return <BaseTokenCard token={token} onEdit={onEdit} onDelete={onDelete} preview={preview} />
}

export const DurationTokenCard: React.FC<TokenCardProps> = ({ token, onEdit, onDelete }) => {
  const preview = (
    <div className="flex items-center gap-2">
      <div className="w-8 h-2 bg-gradient-to-r from-green-400 to-green-600 rounded animate-pulse"/>
      <span className="text-sm font-medium text-gray-700">{String(token.$value)}</span>
    </div>
  )
  
  return <BaseTokenCard token={token} onEdit={onEdit} onDelete={onDelete} preview={preview} />
}

export const CubicBezierTokenCard: React.FC<TokenCardProps> = ({ token, onEdit, onDelete }) => {
  // Parse cubic-bezier values
  let bezierValues = [0.4, 0, 0.2, 1] // Default ease-in-out
  
  try {
    if (Array.isArray(token.$value)) {
      bezierValues = token.$value.slice(0, 4).map(v => parseFloat(v))
    } else if (typeof token.$value === 'string') {
      // Try to parse from string like "cubic-bezier(0.4, 0, 0.2, 1)" or "[0.4, 0, 0.2, 1]"
      const matches = token.$value.match(/[\d.-]+/g)
      if (matches && matches.length >= 4) {
        bezierValues = matches.slice(0, 4).map(v => parseFloat(v))
      }
    }
  } catch (error) {
    // Use default values if parsing fails
  }
  
  const [x1, y1, x2, y2] = bezierValues
  
  // Create SVG path using cubic-bezier values
  // SVG coordinate system: 64x64 with curve from (8,56) to (56,8)
  const startX = 8, startY = 56
  const endX = 56, endY = 8
  const cp1X = startX + (endX - startX) * x1
  const cp1Y = startY - (startY - endY) * y1
  const cp2X = startX + (endX - startX) * x2
  const cp2Y = startY - (startY - endY) * y2
  
  const preview = (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-center bg-gray-50 p-2 rounded">
        <svg className="w-16 h-16" viewBox="0 0 64 64" fill="none">
          {/* Grid lines for reference */}
          <defs>
            <pattern id="grid" width="8" height="8" patternUnits="userSpaceOnUse">
              <path d="M 8 0 L 0 0 0 8" fill="none" stroke="#e5e7eb" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="64" height="64" fill="url(#grid)" />
          
          {/* Control point lines (dashed) */}
          <line x1={startX} y1={startY} x2={cp1X} y2={cp1Y} stroke="#94a3b8" strokeWidth="1" strokeDasharray="2,2" />
          <line x1={endX} y1={endY} x2={cp2X} y2={cp2Y} stroke="#94a3b8" strokeWidth="1" strokeDasharray="2,2" />
          
          {/* Control points */}
          <circle cx={cp1X} cy={cp1Y} r="2" fill="#3b82f6" />
          <circle cx={cp2X} cy={cp2Y} r="2" fill="#3b82f6" />
          
          {/* Cubic bezier curve */}
          <path 
            d={`M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`}
            stroke="#1e40af" 
            strokeWidth="2.5" 
            fill="none"
          />
          
          {/* Start and end points */}
          <circle cx={startX} cy={startY} r="2.5" fill="#1e40af" />
          <circle cx={endX} cy={endY} r="2.5" fill="#1e40af" />
        </svg>
      </div>
      
      <div className="text-center">
        <span className="text-xs font-mono text-gray-600">
          ({bezierValues.map(v => v.toFixed(2)).join(', ')})
        </span>
      </div>
    </div>
  )
  
  return <BaseTokenCard token={token} onEdit={onEdit} onDelete={onDelete} preview={preview} />
}

export const NumberTokenCard: React.FC<TokenCardProps> = ({ token, onEdit, onDelete }) => {
  const preview = (
    <div className="text-2xl font-bold text-blue-600">
      {String(token.$value)}
    </div>
  )
  
  return <BaseTokenCard token={token} onEdit={onEdit} onDelete={onDelete} preview={preview} />
}

export const StrokeStyleTokenCard: React.FC<TokenCardProps> = ({ token, onEdit, onDelete }) => {
  const strokeStyle = String(token.$value)
  const strokeArray = strokeStyle === 'dashed' ? '5,5' : strokeStyle === 'dotted' ? '2,2' : 'none'
  
  const preview = (
    <div className="flex items-center gap-2">
      <svg className="w-16 h-4" viewBox="0 0 64 16">
        <line 
          x1="4" y1="8" x2="60" y2="8" 
          stroke="currentColor" 
          strokeWidth="2"
          strokeDasharray={strokeArray}
        />
      </svg>
      <span className="text-sm font-medium text-gray-700 capitalize">{strokeStyle}</span>
    </div>
  )
  
  return <BaseTokenCard token={token} onEdit={onEdit} onDelete={onDelete} preview={preview} />
}

export const BorderTokenCard: React.FC<TokenCardProps> = ({ token, onEdit, onDelete }) => {
  const preview = (
    <div className="w-12 h-8 border-2 border-gray-400 rounded bg-gray-50 flex items-center justify-center">
      <span className="text-xs text-gray-600">Border</span>
    </div>
  )
  
  return <BaseTokenCard token={token} onEdit={onEdit} onDelete={onDelete} preview={preview} />
}

export const TransitionTokenCard: React.FC<TokenCardProps> = ({ token, onEdit, onDelete }) => {
  const preview = (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 bg-purple-400 rounded hover:bg-purple-600 transition-all duration-300 transform hover:scale-110"/>
      <span className="text-sm font-medium text-gray-700">Transition</span>
    </div>
  )
  
  return <BaseTokenCard token={token} onEdit={onEdit} onDelete={onDelete} preview={preview} />
}

export const ShadowTokenCard: React.FC<TokenCardProps> = ({ token, onEdit, onDelete }) => {
  const preview = (
    <div className="w-12 h-8 bg-white rounded shadow-lg border border-gray-200 flex items-center justify-center">
      <span className="text-xs text-gray-600">Shadow</span>
    </div>
  )
  
  return <BaseTokenCard token={token} onEdit={onEdit} onDelete={onDelete} preview={preview} />
}

export const GradientTokenCard: React.FC<TokenCardProps> = ({ token, onEdit, onDelete }) => {
  const preview = (
    <div className="w-16 h-8 bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 rounded border border-gray-300 flex items-center justify-center">
      <span className="text-xs text-white font-medium">Gradient</span>
    </div>
  )
  
  return <BaseTokenCard token={token} onEdit={onEdit} onDelete={onDelete} preview={preview} />
}

export const TypographyTokenCard: React.FC<TokenCardProps> = ({ token, onEdit, onDelete }) => {
  const preview = (
    <div className="text-base text-gray-700">
      Typography Sample
    </div>
  )
  
  return <BaseTokenCard token={token} onEdit={onEdit} onDelete={onDelete} preview={preview} />
}

export const TokenCard: React.FC<TokenCardProps> = ({ token, onEdit, onDelete }) => {
  switch (token.$type) {
    case 'color':
      return <ColorTokenCard token={token} onEdit={onEdit} onDelete={onDelete} />
    case 'dimension':
      return <DimensionTokenCard token={token} onEdit={onEdit} onDelete={onDelete} />
    case 'fontFamily':
      return <FontFamilyTokenCard token={token} onEdit={onEdit} onDelete={onDelete} />
    case 'fontWeight':
      return <FontWeightTokenCard token={token} onEdit={onEdit} onDelete={onDelete} />
    case 'duration':
      return <DurationTokenCard token={token} onEdit={onEdit} onDelete={onDelete} />
    case 'cubicBezier':
      return <CubicBezierTokenCard token={token} onEdit={onEdit} onDelete={onDelete} />
    case 'number':
      return <NumberTokenCard token={token} onEdit={onEdit} onDelete={onDelete} />
    case 'strokeStyle':
      return <StrokeStyleTokenCard token={token} onEdit={onEdit} onDelete={onDelete} />
    case 'border':
      return <BorderTokenCard token={token} onEdit={onEdit} onDelete={onDelete} />
    case 'transition':
      return <TransitionTokenCard token={token} onEdit={onEdit} onDelete={onDelete} />
    case 'shadow':
      return <ShadowTokenCard token={token} onEdit={onEdit} onDelete={onDelete} />
    case 'gradient':
      return <GradientTokenCard token={token} onEdit={onEdit} onDelete={onDelete} />
    case 'typography':
      return <TypographyTokenCard token={token} onEdit={onEdit} onDelete={onDelete} />
    default:
      return <BaseTokenCard token={token} onEdit={onEdit} onDelete={onDelete} />
  }
}
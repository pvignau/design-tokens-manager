import React, { useState, useEffect } from 'react'
import type { TokenWithId, TokenType } from '../types/tokens'

interface TokenFormProps {
  onSubmit: (token: Omit<TokenWithId, 'id'>) => void
  editToken?: TokenWithId | null
  onCancel?: () => void
}

const TOKEN_TYPES: { value: TokenType; label: string }[] = [
  { value: 'color', label: 'Color' },
  { value: 'dimension', label: 'Dimension' },
  { value: 'fontFamily', label: 'Font Family' },
  { value: 'fontWeight', label: 'Font Weight' },
  { value: 'duration', label: 'Duration' },
  { value: 'cubicBezier', label: 'Cubic Bezier' },
  { value: 'number', label: 'Number' },
  { value: 'strokeStyle', label: 'Stroke Style' },
  { value: 'border', label: 'Border' },
  { value: 'transition', label: 'Transition' },
  { value: 'shadow', label: 'Shadow' },
  { value: 'gradient', label: 'Gradient' },
  { value: 'typography', label: 'Typography' },
]

export const TokenForm: React.FC<TokenFormProps> = ({ onSubmit, editToken, onCancel }) => {
  const [name, setName] = useState(editToken?.name || '')
  const [type, setType] = useState<TokenType>(editToken?.$type || 'color')
  const [value, setValue] = useState(editToken?.$value ? (typeof editToken.$value === 'string' ? editToken.$value : JSON.stringify(editToken.$value)) : '')
  const [description, setDescription] = useState(editToken?.$description || '')

  // Update form when editToken changes
  useEffect(() => {
    if (editToken) {
      setName(editToken.name)
      setType(editToken.$type)
      setValue(typeof editToken.$value === 'string' ? editToken.$value : JSON.stringify(editToken.$value))
      setDescription(editToken.$description || '')
    } else {
      // Reset form when not editing
      setName('')
      setType('color')
      setValue('')
      setDescription('')
    }
  }, [editToken])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    let parsedValue: any
    try {
      parsedValue = type === 'color' || type === 'dimension' || type === 'fontFamily' 
        ? value 
        : JSON.parse(value)
    } catch {
      parsedValue = value
    }

    onSubmit({
      name,
      $type: type,
      $value: parsedValue,
      $description: description || undefined,
    })

    if (!editToken) {
      setName('')
      setValue('')
      setDescription('')
    }
  }

  const renderValueInput = () => {
    switch (type) {
      case 'color':
        return (
          <div className="flex gap-2">
            <input
              type="color"
              value={value.startsWith('#') ? value : '#000000'}
              onChange={(e) => setValue(e.target.value)}
              className="w-16 h-10 border rounded"
            />
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="#000000 or rgb(0,0,0)"
              className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )
      case 'dimension':
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="16px, 1rem, 2em"
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        )
      case 'fontFamily':
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Arial, Inter, system-ui"
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        )
      case 'fontWeight':
        return (
          <select
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="100">100 - Thin</option>
            <option value="200">200 - Extra Light</option>
            <option value="300">300 - Light</option>
            <option value="400">400 - Normal</option>
            <option value="500">500 - Medium</option>
            <option value="600">600 - Semi Bold</option>
            <option value="700">700 - Bold</option>
            <option value="800">800 - Extra Bold</option>
            <option value="900">900 - Black</option>
          </select>
        )
      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        )
      default:
        return (
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Enter JSON value"
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
          />
        )
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold text-gray-900">
        {editToken ? 'Edit Token' : 'Add New Token'}
      </h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Token Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="e.g., primary-color, font-size-lg"
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Token Type
        </label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as TokenType)}
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {TOKEN_TYPES.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Token Value
        </label>
        {renderValueInput()}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description (optional)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the purpose and usage of this token"
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none"
        />
      </div>

      <div className="flex gap-2 pt-4">
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {editToken ? 'Update Token' : 'Add Token'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
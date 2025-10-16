import type { TokenWithId, TokenType } from '../types/tokens'

interface DTCGToken {
  $type: TokenType
  $value: any
  $description?: string
}

interface DTCGGroup {
  [key: string]: DTCGToken | DTCGGroup
}

function isDTCGToken(obj: any): obj is DTCGToken {
  return obj && typeof obj === 'object' && obj.$type && obj.$value !== undefined
}

function flattenDTCGTokens(obj: DTCGGroup, prefix: string = ''): TokenWithId[] {
  const tokens: TokenWithId[] = []

  for (const [key, value] of Object.entries(obj)) {
    const tokenName = prefix ? `${prefix}.${key}` : key

    if (isDTCGToken(value)) {
      // This is a token
      tokens.push({
        id: `imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: tokenName,
        $type: value.$type,
        $value: value.$value,
        $description: value.$description
      })
    } else if (typeof value === 'object' && value !== null) {
      // This is a group, recurse
      tokens.push(...flattenDTCGTokens(value as DTCGGroup, tokenName))
    }
  }

  return tokens
}

export function parseDTCGFile(jsonContent: string): TokenWithId[] {
  try {
    const parsed = JSON.parse(jsonContent)
    
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Invalid DTCG file: Root must be an object')
    }

    return flattenDTCGTokens(parsed)
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to parse DTCG file: ${error.message}`)
    }
    throw new Error('Failed to parse DTCG file: Unknown error')
  }
}

export function validateDTCGFile(jsonContent: string): { isValid: boolean; error?: string; tokenCount?: number } {
  try {
    const tokens = parseDTCGFile(jsonContent)
    return {
      isValid: true,
      tokenCount: tokens.length
    }
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Unknown validation error'
    }
  }
}
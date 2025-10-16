import type { TokenWithId } from '../types/tokens'

interface FigmaConfig {
  accessToken: string
  fileKey: string
  collectionId?: string // Now optional since we auto-create/find "tslike"
}

interface FigmaVariableCollection {
  action: 'CREATE'
  name: string
  id: string
  initialModeId: string
  description?: string
}

interface FigmaVariable {
  action: 'CREATE' | 'UPDATE'
  name: string
  id: string
  variableCollectionId?: string
  resolvedType?: 'COLOR' | 'FLOAT' | 'STRING' | 'BOOLEAN'
  description?: string
  scopes?: string[]
  codeSyntax?: Record<string, string>
}

interface FigmaVariableModeValue {
  variableId: string
  modeId: string
  value: any
}

interface FigmaBatchRequest {
  variableCollections: FigmaVariableCollection[]
  variables: FigmaVariable[]
  variableModeValues: FigmaVariableModeValue[]
}

class FigmaExporter {
  private config: FigmaConfig
  private baseUrl = 'https://api.figma.com/v1'

  constructor(config: FigmaConfig) {
    this.config = config
  }

  private async makeRequest(endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', body?: any) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers: {
        'X-Figma-Token': this.config.accessToken,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!response.ok) {
      throw new Error(`Figma API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  async getVariableCollections() {
    return this.makeRequest(`/files/${this.config.fileKey}/variables/local`, 'GET')
  }

  async findExistingCollection(collectionName: string): Promise<string | null> {
    try {
      // First, try to get existing collections
      const variablesData = await this.getVariableCollections()
      
      // Look for existing collection with the name
      const existingCollection = Object.values(variablesData.meta?.variableCollections || {}).find(
        (collection: any) => collection.name === collectionName
      )

      if (existingCollection) {
        console.log(`Found existing collection: ${collectionName}`)
        return (existingCollection as any).id
      }

      return null
    } catch (error) {
      console.error('Error checking existing collections:', error)
      return null
    }
  }

  async getExistingVariables(collectionId: string): Promise<{variables: {[key: string]: any}, modeId: string | null}> {
    try {
      const variablesData = await this.getVariableCollections()
      const existingVariables: {[key: string]: any} = {}
      let modeId: string | null = null
      
      // Get the collection's mode information
      const collection = variablesData.meta?.variableCollections?.[collectionId]
      if (collection && collection.modes && collection.modes.length > 0) {
        modeId = collection.modes[0].modeId
        console.log(`Using mode ID: ${modeId} from collection ${collectionId}`)
      }
      
      // Get all variables from the collection
      Object.values(variablesData.meta?.variables || {}).forEach((variable: any) => {
        if (variable.variableCollectionId === collectionId) {
          existingVariables[variable.name] = variable
        }
      })
      
      return { variables: existingVariables, modeId }
    } catch (error) {
      console.error('Error getting existing variables:', error)
      return { variables: {}, modeId: null }
    }
  }

  async createCollectionAndVariables(collectionName: string, tokens: TokenWithId[]) {
    const tempCollectionId = 'tempcoll1'
    const tempModeId = 'tempmode1'
    
    // Prepare batch request
    const request: FigmaBatchRequest = {
      variableCollections: [
        {
          action: 'CREATE',
          name: collectionName,
          id: tempCollectionId,
          initialModeId: tempModeId,
          description: `Auto-created collection for design tokens`
        }
      ],
      variables: tokens.map((token, index) => ({
        action: 'CREATE',
        name: token.name.replace(/\./g, '-'),
        id: `tempvar${index}`,
        variableCollectionId: tempCollectionId,
        resolvedType: this.mapTokenTypeToFigmaType(token.$type),
        description: token.$description || `${token.$type} token`,
        scopes: this.getVariableScopes(token.$type),
        codeSyntax: {
          WEB: token.name.replace(/\s+/g, '-').toLowerCase(),
          ANDROID: token.name.replace(/\s+/g, '_').toLowerCase(),
          IOS: token.name.replace(/\s+/g, '').toLowerCase(),
        }
      })),
      variableModeValues: tokens.map((token, index) => ({
        variableId: `tempvar${index}`,
        modeId: tempModeId,
        value: this.formatValueForFigma(token)
      }))
    }
    
    return this.makeRequest(`/files/${this.config.fileKey}/variables`, 'POST', request)
  }

  async createVariablesInExistingCollection(collectionId: string, tokens: TokenWithId[]) {
    // Get existing variables and mode ID to check what needs to be created vs updated
    const { variables: existingVariables, modeId } = await this.getExistingVariables(collectionId)
    console.log(`Found ${Object.keys(existingVariables).length} existing variables in collection`)
    
    // Use the actual mode ID from the collection, fallback to default if not found
    const actualModeId = modeId || '1:0'
    if (!modeId) {
      console.warn('Could not determine mode ID from collection, using fallback: 1:0')
    }
    
    const variables: FigmaVariable[] = []
    const variableModeValues: FigmaVariableModeValue[] = []
    let updateCount = 0
    let createCount = 0
    
    tokens.forEach((token, index) => {
      const sanitizedName = token.name.replace(/\./g, '-')
      const existingVariable = existingVariables[sanitizedName]
      
      if (existingVariable) {
        // Variable exists, UPDATE it
        console.log(`Updating existing variable: ${sanitizedName}`)
        updateCount++
        variables.push({
          action: 'UPDATE',
          name: sanitizedName,
          id: existingVariable.id,
          description: token.$description || `${token.$type} token`,
          scopes: this.getVariableScopes(token.$type),
          codeSyntax: {
            WEB: token.name.replace(/\s+/g, '-').toLowerCase(),
            ANDROID: token.name.replace(/\s+/g, '_').toLowerCase(),
            IOS: token.name.replace(/\s+/g, '').toLowerCase(),
          }
        })
        
        variableModeValues.push({
          variableId: existingVariable.id,
          modeId: actualModeId,
          value: this.formatValueForFigma(token)
        })
      } else {
        // Variable doesn't exist, CREATE it
        console.log(`Creating new variable: ${sanitizedName}`)
        createCount++
        const tempId = `tempvar${index}`
        variables.push({
          action: 'CREATE',
          name: sanitizedName,
          id: tempId,
          variableCollectionId: collectionId,
          resolvedType: this.mapTokenTypeToFigmaType(token.$type),
          description: token.$description || `${token.$type} token`,
          scopes: this.getVariableScopes(token.$type),
          codeSyntax: {
            WEB: token.name.replace(/\s+/g, '-').toLowerCase(),
            ANDROID: token.name.replace(/\s+/g, '_').toLowerCase(),
            IOS: token.name.replace(/\s+/g, '').toLowerCase(),
          }
        })
        
        variableModeValues.push({
          variableId: tempId,
          modeId: actualModeId,
          value: this.formatValueForFigma(token)
        })
      }
    })
    
    console.log(`Batch operation: ${createCount} variables to create, ${updateCount} variables to update`)
    
    const request: FigmaBatchRequest = {
      variableCollections: [], // No new collections
      variables,
      variableModeValues
    }
    
    return this.makeRequest(`/files/${this.config.fileKey}/variables`, 'POST', request)
  }

  private mapTokenTypeToFigmaType(tokenType: string): 'COLOR' | 'FLOAT' | 'STRING' | 'BOOLEAN' {
    switch (tokenType) {
      case 'color':
        return 'COLOR'
      case 'dimension':
      case 'fontWeight':
      case 'duration':
      case 'number':
        return 'FLOAT'
      case 'fontFamily':
      case 'strokeStyle':
        return 'STRING'
      default:
        return 'STRING'
    }
  }

  private getVariableScopes(tokenType: string): string[] {
    switch (tokenType) {
      case 'color':
        return ['ALL_FILLS', 'STROKE_COLOR']
      case 'dimension':
        return ['WIDTH_HEIGHT', 'GAP', 'CORNER_RADIUS']
      case 'fontFamily':
        return ['FONT_FAMILY']
      case 'fontWeight':
        return ['FONT_WEIGHT']
      case 'duration':
        return ['EFFECT_FLOAT']
      case 'number':
        return ['OPACITY', 'STROKE_FLOAT']
      case 'fontSize':
        return ['FONT_SIZE']
      case 'lineHeight':
        return ['LINE_HEIGHT']
      case 'letterSpacing':
        return ['LETTER_SPACING']
      case 'paragraphSpacing':
        return ['PARAGRAPH_SPACING']
      case 'paragraphIndent':
        return ['PARAGRAPH_INDENT']
      case 'fontStyle':
        return ['FONT_STYLE']
      case 'fontVariations':
        return ['FONT_VARIATIONS']
      default:
        return ['ALL_SCOPES']
    }
  }

  private formatValueForFigma(token: TokenWithId) {
    switch (token.$type) {
      case 'color':
        // Convert hex to RGB object if needed
        if (typeof token.$value === 'string' && token.$value.startsWith('#')) {
          const hex = token.$value.slice(1)
          const r = parseInt(hex.substr(0, 2), 16) / 255
          const g = parseInt(hex.substr(2, 2), 16) / 255
          const b = parseInt(hex.substr(4, 2), 16) / 255
          return { r, g, b, a: 1 }
        }
        return token.$value
      case 'dimension':
        // Convert dimension string to number if needed
        if (typeof token.$value === 'string') {
          const numValue = parseFloat(token.$value.replace(/[^\d.]/g, ''))
          return isNaN(numValue) ? 0 : numValue
        }
        return token.$value
      case 'fontWeight':
        return typeof token.$value === 'string' ? parseInt(token.$value) : token.$value
      default:
        return token.$value
    }
  }

  async exportTokensToFigma(tokens: TokenWithId[], collectionIdOrName?: string) {
    try {
      // Use "tslike" as default collection name
      const targetCollection = collectionIdOrName || 'tslike'
      
      let result: any
      let collectionId: string
      let collectionName: string
      
      // Check if it's a collection ID (starts with "VariableCollectionId:") or a name
      if (targetCollection.startsWith('VariableCollectionId:')) {
        // It's an existing collection ID
        collectionId = targetCollection
        collectionName = 'Existing Collection'
        console.log('Adding variables to existing collection...')
        result = await this.createVariablesInExistingCollection(collectionId, tokens)
      } else {
        // It's a name, check if it exists first
        const existingCollectionId = await this.findExistingCollection(targetCollection)
        
        if (existingCollectionId) {
          // Collection exists, add variables to it
          collectionId = existingCollectionId
          collectionName = targetCollection
          console.log(`Adding variables to existing collection: ${targetCollection}`)
          result = await this.createVariablesInExistingCollection(collectionId, tokens)
        } else {
          // Collection doesn't exist, create collection and variables together
          collectionId = 'temp_coll_1' // This will be replaced by Figma
          collectionName = targetCollection
          console.log(`Creating new collection "${targetCollection}" with variables...`)
          result = await this.createCollectionAndVariables(targetCollection, tokens)
        }
      }

      // Process results
      const results = tokens.map((token, index) => ({
        token: token.name,
        success: true, // We'll assume success if no error thrown
        variableId: result.variables?.[index]?.id || `variable-${index}`,
      }))

      return {
        success: true,
        collectionId,
        collectionName,
        results,
        summary: {
          total: tokens.length,
          successful: results.length,
          failed: 0,
        },
      }
    } catch (error) {
      throw new Error(`Failed to export to Figma: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}

export { FigmaExporter, type FigmaConfig }
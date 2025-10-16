// For Figma plugin compatibility, we'll define types locally
interface DesignToken {
  id: string;
  name: string;
  type: string;
  value: any;
  description?: string;
}

interface WebSocketMessage {
  type: 'sync' | 'update' | 'create' | 'delete';
  payload: any;
}

interface TokenSyncMessage extends WebSocketMessage {
  type: 'sync';
  payload: {
    tokens: DesignToken[];
  };
}

// Hybrid HTTP + SSE client for Figma plugin
class HybridClient {
  private url: string;
  private messageHandlers: ((message: WebSocketMessage) => void)[] = [];
  private pollingInterval: number | null = null;
  private isConnected: boolean = false;

  constructor(url: string) {
    this.url = url.replace('ws://', 'http://').replace('/ws', '');
  }

  async connect(): Promise<void> {
    try {
      console.log('🔗 Initializing hybrid client for', this.url);
      
      // Start polling for updates (Figma doesn't support SSE)
      this.connectPolling();
      this.isConnected = true;
      
      return Promise.resolve();
    } catch (error) {
      console.error('❌ Hybrid client error:', error);
      throw error;
    }
  }

  private connectPolling(): void {
    console.log('🔄 Starting polling for updates...');
    
    // Initial connection status
    figma.ui.postMessage({ 
      type: 'CONNECTION_STATUS', 
      connected: true,
      method: 'HTTP Polling'
    });

    // Poll for updates every 3 seconds
    const pollForUpdates = async () => {
      if (!this.isConnected) return;
      
      try {
        const response = await fetch(`${this.url}/api/tokens`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.tokens && data.tokens.length > 0) {
            console.log('📨 Polled update received:', data);
            
            // Handle the update
            const message: WebSocketMessage = {
              type: 'sync',
              payload: { tokens: data.tokens }
            };
            
            this.messageHandlers.forEach(handler => handler(message));
            
            // Notify UI
            figma.ui.postMessage({
              type: 'REAL_TIME_UPDATE',
              data: {
                type: 'sync',
                tokens: data.tokens,
                source: 'polling'
              },
              timestamp: Date.now()
            });
          }
        }
      } catch (error) {
        console.log('🔄 Polling check (no updates available)');
      }
      
      // Schedule next poll
      setTimeout(pollForUpdates, 3000);
    };
    
    // Start polling
    setTimeout(pollForUpdates, 1000);
  }

  async send(message: WebSocketMessage): Promise<void> {
    try {
      console.log('📤 Sending HTTP message:', message.type);
      
      const response = await fetch(`${this.url}/api/tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });
      
      if (!response.ok) {
        console.error('❌ HTTP request failed:', response.statusText);
        figma.ui.postMessage({ 
          type: 'CONNECTION_STATUS', 
          connected: false,
          error: `HTTP ${response.status}: ${response.statusText}`
        });
      } else {
        const result = await response.json();
        console.log('✅ Message sent successfully:', {
          type: message.type,
          clients: result.clients
        });
        
        figma.ui.postMessage({ 
          type: 'SYNC_STATUS', 
          success: true,
          clients: result.clients,
          message: result.message
        });
      }
    } catch (error) {
      console.error('❌ Error sending message:', error);
      figma.ui.postMessage({ 
        type: 'CONNECTION_STATUS', 
        connected: false,
        error: error.message
      });
    }
  }

  onMessage(callback: (message: WebSocketMessage) => void): void {
    this.messageHandlers.push(callback);
  }

  disconnect(): void {
    console.log('🔌 Disconnecting hybrid client');
    this.isConnected = false;
  }
}

class FigmaPluginController {
  private hybridClient: HybridClient;
  
  constructor() {
    this.hybridClient = new HybridClient('ws://localhost:5173/ws');
    this.init();
  }

  private async init() {
    try {
      await this.hybridClient.connect();
      this.setupMessageHandlers();
      console.log('🚀 Figma plugin controller initialized');
    } catch (error) {
      console.error('❌ Failed to connect to server:', error);
      figma.ui.postMessage({ 
        type: 'CONNECTION_STATUS', 
        connected: false,
        error: error.message
      });
    }
  }

  private setupMessageHandlers() {
    this.hybridClient.onMessage((message) => {
      switch (message.type) {
        case 'sync':
          this.handleTokenSync(message as TokenSyncMessage);
          break;
        case 'update':
          this.handleTokenUpdate(message);
          break;
        default:
          console.log('🤷 Unhandled message type:', message.type);
      }
    });
  }

  private handleTokenSync(message: TokenSyncMessage) {
    const tokens = message.payload.tokens;
    console.log('Received tokens sync:', tokens);
    figma.ui.postMessage({ type: 'TOKENS_SYNCED', tokens });
  }

  private handleTokenUpdate(message: any) {
    console.log('Token updated:', message.payload.token);
    figma.ui.postMessage({ type: 'TOKEN_UPDATED', token: message.payload.token });
  }

  public async syncTokensFromFigma() {
    const tokens = this.extractTokensFromFigma();
    console.log(`🔄 Syncing ${tokens.length} tokens from Figma`);
    
    await this.hybridClient.send({
      type: 'sync',
      payload: { tokens }
    });
    
    // Update local UI with extracted tokens
    figma.ui.postMessage({ 
      type: 'TOKENS_SYNCED', 
      tokens: tokens,
      source: 'local'
    });
  }

  private extractTokensFromFigma(): DesignToken[] {
    const tokens: DesignToken[] = [];
    
    // Extract from Variables (colors, dimensions, numbers, etc.)
    const collections = figma.variables.getLocalVariableCollections();
    
    collections.forEach((collection) => {
      console.log(`📂 Processing collection: ${collection.name}`);
      
      collection.variableIds.forEach((variableId) => {
        const variable = figma.variables.getVariableById(variableId);
        
        if (variable) {
          // Get the default mode value
          const defaultModeId = collection.defaultModeId;
          const value = variable.valuesByMode[defaultModeId];
          
          if (value !== undefined) {
            const token = this.convertVariableToToken(variable, value, collection.name);
            if (token) {
              tokens.push(token);
            }
          }
        }
      });
    });

    // Keep Typography from Text Styles (not variables)
    const textStyles = figma.getLocalTextStyles();
    textStyles.forEach((style) => {
      tokens.push({
        id: style.id,
        name: style.name,
        type: 'typography',
        value: {
          fontSize: style.fontSize,
          fontFamily: style.fontName ? style.fontName.family : undefined,
          fontWeight: style.fontName ? style.fontName.style : undefined,
          lineHeight: style.lineHeight
        },
        description: style.description
      });
    });

    console.log(`🎨 Extracted ${tokens.length} tokens total`);
    return tokens;
  }

  private convertVariableToToken(variable: Variable, value: any, collectionName: string): DesignToken | null {
    try {
      let tokenType: string;
      let tokenValue: any;

      switch (variable.resolvedType) {
        case 'COLOR':
          tokenType = 'color';
          if (typeof value === 'object' && value.r !== undefined) {
            tokenValue = this.rgbaToHex(value);
          } else {
            tokenValue = '#000000'; // fallback
          }
          break;

        case 'FLOAT':
          // Determine if it's a dimension or just a number
          if (variable.name.toLowerCase().includes('spacing') || 
              variable.name.toLowerCase().includes('size') ||
              variable.name.toLowerCase().includes('width') ||
              variable.name.toLowerCase().includes('height') ||
              variable.name.toLowerCase().includes('margin') ||
              variable.name.toLowerCase().includes('padding')) {
            tokenType = 'dimension';
            tokenValue = `${value}px`;
          } else {
            tokenType = 'number';
            tokenValue = value;
          }
          break;

        case 'STRING':
          // Could be font family or other string value
          if (variable.name.toLowerCase().includes('font')) {
            tokenType = 'fontFamily';
            tokenValue = value;
          } else {
            tokenType = 'string';
            tokenValue = value;
          }
          break;

        case 'BOOLEAN':
          tokenType = 'boolean';
          tokenValue = value;
          break;

        default:
          console.log(`❓ Unknown variable type: ${variable.resolvedType} for ${variable.name}`);
          return null;
      }

      return {
        id: variable.id,
        name: `${collectionName}/${variable.name}`,
        type: tokenType,
        value: tokenValue,
        description: variable.description || `${tokenType} variable from ${collectionName}`
      };

    } catch (error) {
      console.error(`❌ Error converting variable ${variable.name}:`, error);
      return null;
    }
  }

  private rgbaToHex(color: { r: number; g: number; b: number; a?: number }): string {
    const toHex = (n: number) => Math.round(n * 255).toString(16).padStart(2, '0');
    const hex = `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;
    
    // If alpha is present and not 1, include it
    if (color.a !== undefined && color.a < 1) {
      const alphaHex = Math.round(color.a * 255).toString(16).padStart(2, '0');
      return `${hex}${alphaHex}`;
    }
    
    return hex;
  }

  private paintToHex(paint: any): string {
    if (paint && paint.type === 'SOLID' && paint.color) {
      const { r, g, b } = paint.color;
      const toHex = (n: number) => Math.round(n * 255).toString(16).padStart(2, '0');
      return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }
    return '#000000';
  }
}

figma.showUI(__html__, { width: 400, height: 600 });

const controller = new FigmaPluginController();

figma.ui.onmessage = (message) => {
  if (message.type === 'CLOSE_PLUGIN') {
    figma.closePlugin();
  } else if (message.type === 'SYNC_TOKENS') {
    controller.syncTokensFromFigma();
  }
};


// Simple HTTP server for receiving tokens from Figma plugin
import { DesignToken } from './types/tokens.js';

interface TokenMessage {
  type: 'sync' | 'update' | 'create' | 'delete';
  payload: any;
}

class TokenHttpServer {
  private tokens: DesignToken[] = [];
  private onTokenUpdateCallback?: (tokens: DesignToken[]) => void;

  constructor() {
    this.setupServer();
  }

  private setupServer() {
    // This would be handled by Vite in dev mode
    console.log('Token HTTP server initialized');
  }

  onTokenUpdate(callback: (tokens: DesignToken[]) => void) {
    this.onTokenUpdateCallback = callback;
  }

  handleTokenMessage(message: TokenMessage) {
    console.log('Received token message:', message);
    
    switch (message.type) {
      case 'sync':
        this.tokens = message.payload.tokens;
        console.log('Synced tokens from Figma:', this.tokens.length, 'tokens');
        if (this.onTokenUpdateCallback) {
          this.onTokenUpdateCallback(this.tokens);
        }
        break;
      case 'update': {
        const updateIndex = this.tokens.findIndex(t => t.id === message.payload.token.id);
        if (updateIndex !== -1) {
          this.tokens[updateIndex] = message.payload.token;
        } else {
          this.tokens.push(message.payload.token);
        }
        if (this.onTokenUpdateCallback) {
          this.onTokenUpdateCallback(this.tokens);
        }
        break;
      }
      case 'create':
        this.tokens.push(message.payload.token);
        if (this.onTokenUpdateCallback) {
          this.onTokenUpdateCallback(this.tokens);
        }
        break;
      case 'delete':
        this.tokens = this.tokens.filter(t => t.id !== message.payload.tokenId);
        if (this.onTokenUpdateCallback) {
          this.onTokenUpdateCallback(this.tokens);
        }
        break;
    }
  }

  getTokens(): DesignToken[] {
    return this.tokens;
  }
}

export const tokenHttpServer = new TokenHttpServer();

// Expose API for Figma plugin to call
if (typeof window !== 'undefined') {
  (window as any).tokenAPI = {
    handleMessage: (message: TokenMessage) => {
      tokenHttpServer.handleTokenMessage(message);
    },
    getTokens: () => tokenHttpServer.getTokens()
  };
}
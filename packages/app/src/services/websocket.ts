import { WebSocketClient, WebSocketServer, DesignToken, WebSocketMessage } from '@design-tokens-manager/shared';

class TokenWebSocketService {
  private server: WebSocketServer | null = null;
  private client: WebSocketClient | null = null;
  private isServer: boolean = false;
  private onTokenUpdateCallback?: (token: DesignToken) => void;

  async startServer(port: number = 8080) {
    try {
      this.server = new WebSocketServer(port);
      this.isServer = true;
      console.log(`WebSocket server started on port ${port}`);
      return true;
    } catch (error) {
      console.error('Failed to start WebSocket server:', error);
      return false;
    }
  }

  async connectAsClient(url: string = 'ws://localhost:8080') {
    try {
      this.client = new WebSocketClient(url);
      await this.client.connect();
      
      this.client.onMessage((message) => {
        this.handleMessage(message);
      });
      
      console.log('Connected as WebSocket client');
      return true;
    } catch (error) {
      console.error('Failed to connect as WebSocket client:', error);
      return false;
    }
  }

  private handleMessage(message: WebSocketMessage) {
    switch (message.type) {
      case 'sync':
        console.log('Received token sync:', message.payload);
        break;
      case 'update':
        if (this.onTokenUpdateCallback) {
          this.onTokenUpdateCallback(message.payload.token);
        }
        break;
      case 'create':
        console.log('Token created:', message.payload.token);
        break;
      case 'delete':
        console.log('Token deleted:', message.payload.tokenId);
        break;
    }
  }

  syncTokens(tokens: DesignToken[]) {
    const message: WebSocketMessage = {
      type: 'sync',
      payload: { tokens }
    };

    if (this.isServer && this.server) {
      this.server.broadcast(message);
    } else if (this.client) {
      this.client.send(message);
    }
  }

  updateToken(token: DesignToken) {
    const message: WebSocketMessage = {
      type: 'update',
      payload: { token }
    };

    if (this.isServer && this.server) {
      this.server.broadcast(message);
    } else if (this.client) {
      this.client.send(message);
    }
  }

  createToken(token: DesignToken) {
    const message: WebSocketMessage = {
      type: 'create',
      payload: { token }
    };

    if (this.isServer && this.server) {
      this.server.broadcast(message);
    } else if (this.client) {
      this.client.send(message);
    }
  }

  deleteToken(tokenId: string) {
    const message: WebSocketMessage = {
      type: 'delete',
      payload: { tokenId }
    };

    if (this.isServer && this.server) {
      this.server.broadcast(message);
    } else if (this.client) {
      this.client.send(message);
    }
  }

  onTokenUpdate(callback: (token: DesignToken) => void) {
    this.onTokenUpdateCallback = callback;
  }

  disconnect() {
    if (this.client) {
      this.client.disconnect();
      this.client = null;
    }
    if (this.server) {
      this.server.close();
      this.server = null;
    }
  }
}

export const tokenWebSocketService = new TokenWebSocketService();
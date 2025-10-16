export interface DesignToken {
  id: string;
  name: string;
  type: string;
  value: any;
  description?: string;
}

export interface WebSocketMessage {
  type: 'sync' | 'update' | 'create' | 'delete';
  payload: any;
}

export interface TokenSyncMessage extends WebSocketMessage {
  type: 'sync';
  payload: {
    tokens: DesignToken[];
  };
}

export interface TokenUpdateMessage extends WebSocketMessage {
  type: 'update';
  payload: {
    token: DesignToken;
  };
}

export interface TokenCreateMessage extends WebSocketMessage {
  type: 'create';
  payload: {
    token: DesignToken;
  };
}

export interface TokenDeleteMessage extends WebSocketMessage {
  type: 'delete';
  payload: {
    tokenId: string;
  };
}
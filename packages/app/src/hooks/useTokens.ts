import { useState, useCallback, useEffect } from 'react'
import type { TokenWithId, TokenType, DesignToken } from '../types/tokens'

export const useTokens = () => {
  const [tokens, setTokens] = useState<TokenWithId[]>([])
  const [wsConnected, setWsConnected] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<number>(0)

  const addToken = useCallback((token: Omit<TokenWithId, 'id'>) => {
    const newToken: TokenWithId = {
      ...token,
      id: crypto.randomUUID(),
    }
    setTokens(prev => [...prev, newToken])
  }, [])

  const updateToken = useCallback((id: string, updates: Partial<Omit<TokenWithId, 'id'>>) => {
    setTokens(prev => prev.map(token => 
      token.id === id ? { ...token, ...updates } : token
    ))
  }, [])

  const deleteToken = useCallback((id: string) => {
    setTokens(prev => prev.filter(token => token.id !== id))
  }, [])

  const getTokensByType = useCallback((type: TokenType) => {
    return tokens.filter(token => token.$type === type)
  }, [tokens])

  const exportToDTCG = useCallback(() => {
    const result: Record<string, any> = {}
    
    tokens.forEach(token => {
      result[token.name] = {
        $type: token.$type,
        $value: token.$value,
        ...(token.$description && { $description: token.$description })
      }
    })
    
    return result
  }, [tokens])

  const exportToJSON = useCallback(() => {
    const dtcgData = exportToDTCG()
    return JSON.stringify(dtcgData, null, 2)
  }, [exportToDTCG])

  const importTokens = useCallback((newTokens: TokenWithId[], replaceAll: boolean = false) => {
    if (replaceAll) {
      setTokens(newTokens)
    } else {
      setTokens(prev => [...prev, ...newTokens])
    }
  }, [])

  const clearAllTokens = useCallback(() => {
    setTokens([])
  }, [])

  // Convert DesignToken (from Figma) to TokenWithId (for React app)
  const convertDesignToken = useCallback((designToken: DesignToken): TokenWithId => {
    // Map Figma token types to DTCG types
    const typeMapping: Record<string, TokenType> = {
      'color': 'color',
      'typography': 'typography',
      'dimension': 'dimension',
      'fontFamily': 'fontFamily',
      'fontWeight': 'fontWeight',
      'number': 'number',
      'string': 'fontFamily', // Map generic strings to fontFamily for now
      'boolean': 'number' // Map booleans to numbers for compatibility
    };

    return {
      id: designToken.id,
      name: designToken.name,
      $type: typeMapping[designToken.type] || 'dimension',
      $value: designToken.value,
      $description: designToken.description
    };
  }, [])

  // WebSocket integration for real-time Figma sync
  useEffect(() => {
    let ws: WebSocket | null = null;
    
    const connectWebSocket = () => {
      try {
        ws = new WebSocket('ws://localhost:8080');
        
        ws.onopen = () => {
          console.log('🔌 Connected to WebSocket for token sync');
          setWsConnected(true);
          
          // Request initial tokens when connecting
          if (ws) {
            ws.send(JSON.stringify({ type: 'request_tokens' }));
          }
        };
        
        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            console.log('📨 Received WebSocket message:', message);
            
            if (message.type === 'sync' && message.payload?.tokens) {
              const now = Date.now();
              const timeSinceLastSync = now - lastSyncTime;
              
              // Throttle sync messages to prevent duplicates (min 1 second between syncs)
              if (timeSinceLastSync < 1000) {
                console.log('🚫 Sync throttled - too soon after last sync (', timeSinceLastSync, 'ms)');
                return;
              }
              
              const figmaTokens: DesignToken[] = message.payload.tokens;
              const convertedTokens = figmaTokens.map(convertDesignToken);
              
              console.log('🎨 Syncing tokens from WebSocket:', convertedTokens.length, 'tokens');
              console.log('🎨 Token details:', convertedTokens);
              
              setLastSyncTime(now);
              
              // Replace existing tokens with Figma tokens (or merge them)
              setTokens(prevTokens => {
                console.log('📝 Previous tokens:', prevTokens.length);
                
                // Get all incoming token IDs to avoid duplicates
                const incomingTokenIds = new Set(convertedTokens.map(t => t.id));
                
                // Keep manually created tokens (not from Figma) and remove old Figma tokens
                const manualTokens = prevTokens.filter(t => {
                  // Keep if it's a manually created token (doesn't match Figma ID patterns)
                  const isFigmaToken = t.id.startsWith('S:') || // Style IDs
                                     t.id.startsWith('T:') || // Text style IDs  
                                     t.id.startsWith('debug-') || // Debug tokens
                                     t.id.includes('VariableID:') || // Variable IDs
                                     incomingTokenIds.has(t.id); // Exact ID match
                  
                  return !isFigmaToken;
                });
                
                // Combine manual tokens with new Figma tokens (no duplicates)
                const newTokens = [...manualTokens, ...convertedTokens];
                console.log('📝 Manual tokens kept:', manualTokens.length);
                console.log('📝 Figma tokens added:', convertedTokens.length);
                console.log('📝 New tokens total:', newTokens.length);
                
                return newTokens;
              });
            }
          } catch (error) {
            console.error('Error processing WebSocket message:', error);
          }
        };
        
        ws.onclose = () => {
          console.log('🔌 WebSocket connection closed');
          setWsConnected(false);
          // Attempt to reconnect after 3 seconds
          setTimeout(connectWebSocket, 3000);
        };
        
        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          setWsConnected(false);
        };
        
      } catch (error) {
        console.error('Failed to create WebSocket connection:', error);
        setWsConnected(false);
      }
    };

    connectWebSocket();

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [convertDesignToken]);

  return {
    tokens,
    addToken,
    updateToken,
    deleteToken,
    getTokensByType,
    exportToDTCG,
    exportToJSON,
    importTokens,
    clearAllTokens,
    wsConnected, // Expose connection status
  }
}
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { WebSocketServer } from 'ws'

// Hybrid communication plugin (SSE + WebSocket + HTTP)
const hybridCommunicationPlugin = () => {
  // Store connected clients
  const sseClients = new Set();
  const wsClients = new Set();
  let currentTokens = [];
  let wss = null;

  // Broadcast to all clients (SSE + WebSocket)
  const broadcastToAll = (data) => {
    console.log(`📡 Broadcasting to ${sseClients.size} SSE + ${wsClients.size} WS clients`);
    
    // Broadcast to SSE clients (Figma plugins)
    const sseMessage = `data: ${JSON.stringify(data)}\n\n`;
    sseClients.forEach(client => {
      try {
        client.write(sseMessage);
      } catch (error) {
        console.error('Error sending SSE message:', error);
        sseClients.delete(client);
      }
    });

    // Broadcast to WebSocket clients (web apps, APIs)
    const wsMessage = JSON.stringify(data);
    wsClients.forEach(client => {
      try {
        if (client.readyState === 1) { // OPEN
          client.send(wsMessage);
        }
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
        wsClients.delete(client);
      }
    });
  };

  // Initialize WebSocket server
  const initWebSocketServer = () => {
    try {
      wss = new WebSocketServer({ port: 8080 });
      console.log('🚀 WebSocket server started on port 8080');

      wss.on('connection', (ws) => {
        console.log('🔌 New WebSocket client connected');
        wsClients.add(ws);

        // Send initial tokens if available
        if (currentTokens.length > 0) {
          ws.send(JSON.stringify({
            type: 'initial_sync',
            tokens: currentTokens,
            timestamp: Date.now()
          }));
        }

        // Handle incoming WebSocket messages
        ws.on('message', (data) => {
          try {
            const message = JSON.parse(data.toString());
            console.log('📨 Received from WebSocket client:', message);
            
            // Store tokens and broadcast to all clients
            if (message.type === 'sync' && message.payload.tokens) {
              currentTokens = message.payload.tokens;
            }

            broadcastToAll({
              ...message,
              source: 'websocket',
              timestamp: Date.now()
            });
          } catch (error) {
            console.error('Error processing WebSocket message:', error);
          }
        });

        ws.on('close', () => {
          console.log('🔌 WebSocket client disconnected');
          wsClients.delete(ws);
        });

        ws.on('error', (error) => {
          console.error('WebSocket error:', error);
          wsClients.delete(ws);
        });
      });

    } catch (error) {
      console.error('Failed to start WebSocket server:', error);
    }
  };

  return {
    name: 'hybrid-communication',
    configureServer(server) {
      // Initialize WebSocket server
      initWebSocketServer();

      // SSE endpoint for real-time updates (mainly for Figma)
      server.middlewares.use('/api/stream', (req, res, next) => {
        if (req.method === 'GET') {
          console.log('📡 New SSE client connected');
          
          // Setup SSE headers
          res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Cache-Control',
          });

          // Send initial data if available
          if (currentTokens.length > 0) {
            res.write(`data: ${JSON.stringify({
              type: 'initial_sync',
              tokens: currentTokens,
              timestamp: Date.now()
            })}\n\n`);
          }

          // Add to client list
          sseClients.add(res);

          // Cleanup on disconnect
          req.on('close', () => {
            console.log('📡 SSE client disconnected');
            sseClients.delete(res);
          });

          req.on('error', () => {
            sseClients.delete(res);
          });

        } else {
          next();
        }
      });

      // HTTP endpoints for token management
      server.middlewares.use('/api/tokens', (req, res, next) => {
        if (req.method === 'GET') {
          // GET endpoint for polling current tokens
          res.writeHead(200, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          });
          res.end(JSON.stringify({
            tokens: currentTokens,
            timestamp: Date.now(),
            clients: {
              sse: sseClients.size,
              ws: wsClients.size,
              total: sseClients.size + wsClients.size
            }
          }));
        } else if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk.toString();
          });
          req.on('end', () => {
            try {
              const message = JSON.parse(body);
              console.log('📨 Received from Figma plugin:', message);
              
              // Store current tokens
              if (message.type === 'sync' && message.payload.tokens) {
                currentTokens = message.payload.tokens;
                console.log(`🔄 Synced ${currentTokens.length} tokens`);
              }

              // Broadcast to ALL clients (SSE + WebSocket)
              broadcastToAll({
                ...message,
                source: 'figma',
                timestamp: Date.now()
              });
              
              res.writeHead(200, {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
              });
              res.end(JSON.stringify({ 
                success: true, 
                message: 'Token received and broadcasted',
                sseClients: sseClients.size,
                wsClients: wsClients.size,
                totalClients: sseClients.size + wsClients.size
              }));
            } catch (error) {
              console.error('Error processing token message:', error);
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
          });
        } else if (req.method === 'OPTIONS') {
          res.writeHead(200, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
          });
          res.end();
        } else {
          next();
        }
      });
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), hybridCommunicationPlugin()],
  server: {
    cors: true,
  }
})

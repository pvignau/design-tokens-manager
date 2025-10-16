import React, { useState, useEffect } from 'react';

interface ServerInfo {
  name: string;
  status: 'running' | 'stopped' | 'error';
  port?: number;
  url?: string;
  clients?: number;
  lastActivity?: string;
  details?: string;
}

interface ConnectionStats {
  sseClients: number;
  wsClients: number;
  totalClients: number;
  lastUpdate?: number;
  tokens?: number;
}

export const ServerStatus: React.FC = () => {
  const [servers, setServers] = useState<ServerInfo[]>([
    { name: 'Vite Dev Server', status: 'running', port: 5173, url: 'http://localhost:5173' },
    { name: 'WebSocket Server', status: 'running', port: 8080, url: 'ws://localhost:8080' },
    { name: 'SSE Stream', status: 'running', url: 'http://localhost:5173/api/stream' },
    { name: 'Token API', status: 'running', url: 'http://localhost:5173/api/tokens' }
  ]);

  const [connectionStats, setConnectionStats] = useState<ConnectionStats>({
    sseClients: 0,
    wsClients: 0,
    totalClients: 0
  });

  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);

  // Test server connectivity
  const testServer = async (server: ServerInfo): Promise<ServerInfo> => {
    try {
      if (server.name === 'WebSocket Server') {
        // Test WebSocket connection
        return new Promise((resolve) => {
          const testWs = new WebSocket(server.url!);
          const timeout = setTimeout(() => {
            resolve({ ...server, status: 'error', details: 'Connection timeout' });
          }, 3000);

          testWs.onopen = () => {
            clearTimeout(timeout);
            testWs.close();
            resolve({ ...server, status: 'running', details: 'WebSocket connection successful' });
          };

          testWs.onerror = () => {
            clearTimeout(timeout);
            resolve({ ...server, status: 'error', details: 'WebSocket connection failed' });
          };
        });
      } else if (server.url) {
        // Test HTTP endpoints
        const response = await fetch(server.url, { 
          method: server.name === 'Token API' ? 'GET' : 'HEAD',
          signal: AbortSignal.timeout(3000)
        });
        
        if (response.ok) {
          let details = `HTTP ${response.status} ${response.statusText}`;
          
          // Get additional info for Token API
          if (server.name === 'Token API' && response.headers.get('content-type')?.includes('application/json')) {
            const data = await response.json();
            if (data.clients) {
              details += ` | ${data.clients.total} clients connected`;
              setConnectionStats({
                sseClients: data.clients.sse || 0,
                wsClients: data.clients.ws || 0,
                totalClients: data.clients.total || 0,
                tokens: data.tokens?.length || 0,
                lastUpdate: data.timestamp
              });
            }
          }
          
          return { 
            ...server, 
            status: 'running', 
            details,
            lastActivity: new Date().toLocaleTimeString() 
          };
        } else {
          return { 
            ...server, 
            status: 'error', 
            details: `HTTP ${response.status} ${response.statusText}` 
          };
        }
      }
      return { ...server, status: 'error', details: 'No URL to test' };
    } catch (error: any) {
      return { 
        ...server, 
        status: 'error', 
        details: error.name === 'TimeoutError' ? 'Connection timeout' : error.message 
      };
    }
  };

  // Check all servers
  const checkServers = async () => {
    const updatedServers = await Promise.all(servers.map(testServer));
    setServers(updatedServers);
  };

  // Start real-time monitoring
  const startMonitoring = () => {
    if (isMonitoring) return;
    
    try {
      const ws = new WebSocket('ws://localhost:8080');
      
      ws.onopen = () => {
        console.log('📊 Monitoring WebSocket connected');
        setIsMonitoring(true);
        setWsConnection(ws);
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📊 Received monitoring data:', data);
          
          // Update last activity for WebSocket server
          setServers(prev => prev.map(server => 
            server.name === 'WebSocket Server' 
              ? { ...server, lastActivity: new Date().toLocaleTimeString(), details: `Message: ${data.type}` }
              : server
          ));
        } catch (error) {
          console.error('Error parsing monitoring data:', error);
        }
      };
      
      ws.onclose = () => {
        console.log('📊 Monitoring WebSocket disconnected');
        setIsMonitoring(false);
        setWsConnection(null);
      };
      
      ws.onerror = (error) => {
        console.error('📊 Monitoring WebSocket error:', error);
        setIsMonitoring(false);
      };
      
    } catch (error) {
      console.error('Failed to start monitoring:', error);
    }
  };

  // Stop monitoring
  const stopMonitoring = () => {
    if (wsConnection) {
      wsConnection.close();
      setWsConnection(null);
      setIsMonitoring(false);
    }
  };

  // Auto-check servers periodically
  useEffect(() => {
    checkServers();
    const interval = setInterval(checkServers, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return '#22c55e';
      case 'error': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return '✅';
      case 'error': return '❌';
      default: return '⏳';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Server Status Dashboard</h2>
        <div className="flex gap-2">
          <button
            onClick={checkServers}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            🔄 Refresh
          </button>
          <button
            onClick={isMonitoring ? stopMonitoring : startMonitoring}
            className={`px-4 py-2 text-white rounded transition-colors ${
              isMonitoring ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            {isMonitoring ? '⏹ Stop Monitoring' : '▶ Start Monitoring'}
          </button>
        </div>
      </div>

      {/* Connection Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-800">SSE Clients</h3>
          <p className="text-2xl font-bold text-blue-600">{connectionStats.sseClients}</p>
          <p className="text-sm text-blue-500">Figma Plugins</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="font-semibold text-green-800">WebSocket Clients</h3>
          <p className="text-2xl font-bold text-green-600">{connectionStats.wsClients}</p>
          <p className="text-sm text-green-500">Web Apps & APIs</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="font-semibold text-purple-800">Total Connections</h3>
          <p className="text-2xl font-bold text-purple-600">{connectionStats.totalClients}</p>
          <p className="text-sm text-purple-500">All Clients</p>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg">
          <h3 className="font-semibold text-orange-800">Design Tokens</h3>
          <p className="text-2xl font-bold text-orange-600">{connectionStats.tokens || 0}</p>
          <p className="text-sm text-orange-500">Synced Tokens</p>
        </div>
      </div>

      {/* Server Status List */}
      <div className="space-y-4">
        {servers.map((server, index) => (
          <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getStatusIcon(server.status)}</span>
                <div>
                  <h3 className="font-semibold text-lg">{server.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    {server.port && (
                      <span className="flex items-center gap-1">
                        🚪 Port: {server.port}
                      </span>
                    )}
                    {server.url && (
                      <span className="flex items-center gap-1">
                        🔗 <code className="bg-gray-100 px-1 rounded text-xs">{server.url}</code>
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div 
                  className="inline-block px-3 py-1 rounded-full text-sm font-medium text-white"
                  style={{ backgroundColor: getStatusColor(server.status) }}
                >
                  {server.status.toUpperCase()}
                </div>
                {server.lastActivity && (
                  <div className="text-xs text-gray-500 mt-1">
                    Last: {server.lastActivity}
                  </div>
                )}
              </div>
            </div>
            {server.details && (
              <div className="mt-3 p-3 bg-gray-100 rounded text-sm">
                <strong>Details:</strong> {server.details}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Last Update Info */}
      {connectionStats.lastUpdate && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            📊 Last token sync: {new Date(connectionStats.lastUpdate).toLocaleString()}
          </p>
        </div>
      )}

      {/* Monitoring Status */}
      <div className="mt-4 p-3 rounded-lg" style={{ 
        backgroundColor: isMonitoring ? '#dcfce7' : '#fef3c7',
        border: `1px solid ${isMonitoring ? '#bbf7d0' : '#fde68a'}`
      }}>
        <p className="text-sm">
          {isMonitoring ? '📡 Real-time monitoring active' : '⏸ Real-time monitoring stopped'}
        </p>
      </div>
    </div>
  );
};
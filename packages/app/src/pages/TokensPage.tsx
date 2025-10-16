import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { useTokens } from '../hooks/useTokens';
import { TokenFormModal } from '../components/TokenFormModal';
import { TokenList } from '../components/TokenList';
import { TypeFilter } from '../components/TypeFilter';
import { ExportButton } from '../components/ExportButton';
import { FigmaExportButton } from '../components/FigmaExportButton';
import { ImportButton } from '../components/ImportButton';
import { FloatingAddButton } from '../components/FloatingAddButton';
import type { TokenWithId, TokenType } from '../types/tokens';

export const TokensPage: React.FC = () => {
  const { tokens, addToken, updateToken, deleteToken, exportToJSON, importTokens, wsConnected, clearAllTokens } = useTokens();
  const [selectedType, setSelectedType] = useState<TokenType | 'all'>('all');
  const [editingToken, setEditingToken] = useState<TokenWithId | null>(null);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(128);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const tokenCounts = useMemo(() => {
    const counts: Record<TokenType | 'all', number> = {
      all: tokens.length,
      color: 0,
      dimension: 0,
      fontFamily: 0,
      fontWeight: 0,
      duration: 0,
      cubicBezier: 0,
      number: 0,
      strokeStyle: 0,
      border: 0,
      transition: 0,
      shadow: 0,
      gradient: 0,
      typography: 0,
    };

    tokens.forEach(token => {
      counts[token.$type]++;
    });

    return counts;
  }, [tokens]);

  const handleEditToken = (token: TokenWithId) => {
    setEditingToken(token);
    setShowTokenModal(true);
  };

  const handleAddToken = () => {
    setEditingToken(null);
    setShowTokenModal(true);
  };

  const handleTokenSubmit = (tokenData: Omit<TokenWithId, 'id'>) => {
    if (editingToken) {
      updateToken(editingToken.id, tokenData);
    } else {
      addToken(tokenData);
    }
    setEditingToken(null);
    setShowTokenModal(false);
  };

  const handleCloseModal = () => {
    setEditingToken(null);
    setShowTokenModal(false);
  };

  const handleDeleteToken = (id: string) => {
    if (window.confirm('Are you sure you want to delete this token?')) {
      deleteToken(id);
      if (editingToken?.id === id) {
        setEditingToken(null);
      }
    }
  };

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    
    const newWidth = e.clientX;
    if (newWidth >= 100 && newWidth <= 400) {
      setSidebarWidth(newWidth);
    }
  }, [isResizing]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  const handleImport = useCallback((newTokens: TokenWithId[], replaceAll: boolean = false) => {
    importTokens(newTokens, replaceAll);
  }, [importTokens]);

  const handleImportComplete = useCallback((count: number) => {
    alert(`Successfully imported ${count} tokens!`);
  }, []);

  // Debug: Manual token fetch
  const handleManualFetch = useCallback(async () => {
    try {
      console.log('🔍 Manual fetch: Requesting tokens from server...');
      const response = await fetch('/api/tokens');
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 Manual fetch: Server has', data.tokens?.length || 0, 'tokens');
        console.log('🔍 Manual fetch: Token data:', data.tokens);
        
        if (data.tokens && data.tokens.length > 0) {
          // Simulate WebSocket message
          console.log('🔍 Manual fetch: Simulating WebSocket message');
          // This won't work directly, but will show in console for debugging
        }
      }
    } catch (error) {
      console.error('🔍 Manual fetch failed:', error);
    }
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  return (
    <div className="flex flex-1 min-h-0">
      {/* Resizable sidebar */}
      <div 
        ref={sidebarRef}
        className="bg-white shadow-lg flex-shrink-0 relative border-r"
        style={{ width: `${sidebarWidth}px` }}
      >
        <div className="px-2 py-1 border-b">
          <h2 className="text-xs font-semibold text-gray-900">Filters</h2>
        </div>
        <div className="p-1">
          <TypeFilter
            selectedType={selectedType}
            onTypeChange={setSelectedType}
            tokenCounts={tokenCounts}
          />
        </div>
        
        {/* Resize handle */}
        <div
          className={`absolute top-0 right-0 w-1 h-full bg-gray-300 hover:bg-blue-500 cursor-col-resize transition-colors ${
            isResizing ? 'bg-blue-500' : ''
          }`}
          onMouseDown={handleMouseDown}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Actions Bar */}
        <div className="bg-white border-b px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-gray-900">
                {selectedType === 'all' ? 'All Tokens' : `${selectedType} Tokens`}
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({selectedType === 'all' ? tokens.length : tokenCounts[selectedType]} tokens)
                </span>
              </h2>
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                wsConnected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  wsConnected ? 'bg-green-500' : 'bg-gray-400'
                }`} />
                {wsConnected ? 'Figma Sync Active' : 'Figma Sync Offline'}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleManualFetch}
                className="px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600"
              >
                🔍 Debug Fetch
              </button>
              <button
                onClick={clearAllTokens}
                className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
              >
                🗑 Clear All
              </button>
              <ImportButton 
                onImport={handleImport}
                onImportComplete={handleImportComplete}
              />
              <ExportButton onExport={exportToJSON} />
              <FigmaExportButton tokens={tokens} />
            </div>
          </div>
        </div>

        {/* Tokens List */}
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-6xl mx-auto">
            <TokenList
              tokens={tokens}
              onEdit={handleEditToken}
              onDelete={handleDeleteToken}
              selectedType={selectedType}
            />
          </div>
        </main>
      </div>

      {/* Floating Add Button */}
      <FloatingAddButton onClick={handleAddToken} />

      {/* Token Form Modal */}
      <TokenFormModal
        isOpen={showTokenModal}
        onClose={handleCloseModal}
        onSubmit={handleTokenSubmit}
        editToken={editingToken}
      />
    </div>
  );
};
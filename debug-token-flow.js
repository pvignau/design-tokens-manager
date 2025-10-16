#!/usr/bin/env node

// Debug script to test the token flow
import fetch from 'node-fetch';

console.log('🔍 Debug: Testing Token Communication Flow');
console.log('==========================================');

// Test 1: Check if HTTP server is running
console.log('📍 Test 1: Checking HTTP server...');
try {
  const response = await fetch('http://localhost:5173/api/tokens');
  if (response.ok) {
    const data = await response.json();
    console.log('✅ HTTP server responding');
    console.log('📊 Current tokens:', data.tokens?.length || 0);
    console.log('👥 Connected clients:', data.clients?.total || 0);
  } else {
    console.log('❌ HTTP server error:', response.status, response.statusText);
  }
} catch (error) {
  console.log('❌ HTTP server not reachable:', error.message);
}

// Test 2: Send a test token via HTTP POST (simulate Figma)
console.log('\n📍 Test 2: Sending test token via HTTP POST...');
try {
  const testToken = {
    type: 'sync',
    payload: {
      tokens: [
        {
          id: 'debug-color-1',
          name: 'Debug/test-color',
          type: 'color',
          value: '#FF6B6B',
          description: 'Test color token'
        },
        {
          id: 'debug-spacing-1', 
          name: 'Debug/test-spacing',
          type: 'dimension',
          value: '16px',
          description: 'Test spacing token'
        }
      ]
    }
  };

  const response = await fetch('http://localhost:5173/api/tokens', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testToken)
  });

  if (response.ok) {
    const result = await response.json();
    console.log('✅ Token sync successful');
    console.log('📊 Response:', result.message);
    console.log('👥 Clients notified:', result.totalClients || result.clients);
  } else {
    console.log('❌ Token sync failed:', response.status, response.statusText);
  }
} catch (error) {
  console.log('❌ Token sync error:', error.message);
}

// Test 3: Check if tokens were stored
console.log('\n📍 Test 3: Checking if tokens were stored...');
try {
  const response = await fetch('http://localhost:5173/api/tokens');
  if (response.ok) {
    const data = await response.json();
    console.log('📊 Stored tokens:', data.tokens?.length || 0);
    if (data.tokens?.length > 0) {
      data.tokens.forEach((token, i) => {
        console.log(`  ${i + 1}. ${token.name || token.id} (${token.type})`);
      });
    }
  }
} catch (error) {
  console.log('❌ Could not check stored tokens:', error.message);
}

console.log('\n💡 Next steps:');
console.log('1. If HTTP server is not responding: Restart your dev server');
console.log('2. If tokens are stored but not showing in UI: Check browser console');
console.log('3. If WebSocket errors: Make sure no other process is using port 8080');
console.log('4. Check browser Network tab for WebSocket connection status');
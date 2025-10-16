#!/usr/bin/env node

// Simple WebSocket client to test the hybrid communication system
import WebSocket from 'ws';

console.log('🧪 Testing Hybrid Communication System');
console.log('=====================================');

// Connect to WebSocket server
const ws = new WebSocket('ws://localhost:8080');

ws.on('open', () => {
  console.log('✅ Connected to WebSocket server');
  
  // Send a test token update
  const testMessage = {
    type: 'sync',
    payload: {
      tokens: [
        {
          id: 'test-color-1',
          name: 'Primary Blue',
          type: 'color',
          value: '#0066CC',
          description: 'Main brand color'
        },
        {
          id: 'test-typography-1',
          name: 'Heading Large',
          type: 'typography',
          value: {
            fontSize: '32px',
            fontFamily: 'Inter',
            fontWeight: '600'
          },
          description: 'Large heading style'
        }
      ]
    }
  };
  
  console.log('📤 Sending test tokens...');
  ws.send(JSON.stringify(testMessage));
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data.toString());
    console.log('📨 Received message:');
    console.log(`   Type: ${message.type}`);
    console.log(`   Source: ${message.source || 'unknown'}`);
    console.log(`   Timestamp: ${new Date(message.timestamp).toLocaleTimeString()}`);
    
    if (message.payload && message.payload.tokens) {
      console.log(`   Tokens: ${message.payload.tokens.length} items`);
      message.payload.tokens.forEach((token, index) => {
        console.log(`     ${index + 1}. ${token.name} (${token.type}): ${JSON.stringify(token.value).substring(0, 50)}...`);
      });
    }
    console.log('');
  } catch (error) {
    console.error('❌ Error parsing message:', error);
  }
});

ws.on('close', () => {
  console.log('🔌 WebSocket connection closed');
});

ws.on('error', (error) => {
  console.error('❌ WebSocket error:', error.message);
});

// Keep the process alive
console.log('💡 Leave this running to see real-time updates from Figma and other clients');
console.log('💡 Start your web app with: npm run dev:app');
console.log('💡 Open the Figma plugin and sync some tokens to see them here!');
console.log('');
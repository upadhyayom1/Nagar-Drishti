const { WebSocketServer, WebSocket } = require('ws');
const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const { onRealtimeEvent } = require('./realtime');

let wss = null;
const clients = new Set();
let unsubscribe = null;

function getTokenFromRequest(request) {
  const cookies = request.headers.cookie || '';
  const tokenCookie = cookies
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith('token='));

  if (tokenCookie) return decodeURIComponent(tokenCookie.slice('token='.length));

  const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
  return url.searchParams.get('token');
}

function authenticateWebSocket(request) {
  const token = getTokenFromRequest(request);
  if (!token) return null;

  try {
    return jwt.verify(token, env.JWT_SECRET);
  } catch {
    return null;
  }
}

function send(client, event) {
  if (client.readyState !== WebSocket.OPEN) return;
  try {
    client.send(JSON.stringify(event));
  } catch (error) {
    console.error('WebSocket send failed:', error.message);
  }
}

function broadcast(event) {
  for (const client of clients) send(client, event);
}

function initializeWebSocketServer(httpServer, engine) {
  if (wss) return wss;

  wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (socket, request) => {
    const user = authenticateWebSocket(request);
    if (!user) {
      socket.close(1008, 'Unauthorized');
      return;
    }

    clients.add(socket);

    send(socket, {
      type: 'connection:ready',
      data: { userId: user.sub || user.id, role: user.role },
      timestamp: new Date().toISOString(),
    });

    send(socket, {
      type: 'simulation:update',
      data: engine.getRealtimeState(),
      timestamp: new Date().toISOString(),
    });

    socket.on('close', () => clients.delete(socket));
    socket.on('error', () => clients.delete(socket));
  });

  unsubscribe = onRealtimeEvent((event) => broadcast(event));

  console.log('🔌 WebSocket server mounted at /ws');
  return wss;
}

async function closeWebSocketServer() {
  unsubscribe?.();
  unsubscribe = null;
  for (const client of clients) client.close(1001, 'Server shutting down');
  clients.clear();

  if (!wss) return;
  await new Promise((resolve) => wss.close(resolve));
  wss = null;
}

module.exports = {
  closeWebSocketServer,
  initializeWebSocketServer,
};

const { createClient } = require('redis');
const { env } = require('../config/env');

const REALTIME_CHANNEL = 'nagardrishti:realtime';

let publisher = null;
let subscriber = null;
let connected = false;
const listeners = new Set();

function isRealtimeReady() {
  return Boolean(env.REDIS_ENABLED && connected && publisher?.isReady);
}

async function connectRealtime() {
  if (!env.REDIS_ENABLED) {
    console.warn('ℹ️ Redis is disabled (REDIS_ENABLED=false). Realtime will use in-process WebSocket delivery only.');
    return;
  }

  let redisUrl = env.REDIS_URL;
  if (!redisUrl) {
    if (env.NODE_ENV === 'production') {
      console.warn('⚠️ REDIS_URL not provided in production environment. Disabling Redis.');
      return;
    }
    redisUrl = 'redis://127.0.0.1:6379';
  }

  if (connected) return;

  const clientOptions = {
    url: redisUrl,
    socket: {
      reconnectStrategy: (retries) => {
        if (retries > 5) {
          console.warn('⚠️ Redis max retries reached. Realtime events will fallback to local.');
          return new Error('Redis connection failed');
        }
        return Math.min(retries * 1000, 5000);
      }
    }
  };

  if (redisUrl.startsWith('rediss://')) {
    clientOptions.socket.tls = true;
    clientOptions.socket.rejectUnauthorized = false; // Required for some managed Redis instances like Render
  }

  publisher = createClient(clientOptions);
  subscriber = publisher.duplicate();

  let errorCount = 0;
  const errorHandler = (type) => (error) => {
    errorCount++;
    if (errorCount <= 3) {
      console.error(`Redis ${type} error:`, error.message);
    }
  };

  publisher.on('error', errorHandler('publisher'));
  subscriber.on('error', errorHandler('subscriber'));

  await publisher.connect();
  await subscriber.connect();

  await subscriber.subscribe(REALTIME_CHANNEL, (message) => {
    let event;
    try {
      event = JSON.parse(message);
    } catch (error) {
      console.error('Invalid realtime event received from Redis:', error.message);
      return;
    }

    for (const listener of listeners) {
      try {
        listener(event);
      } catch (error) {
        console.error('Realtime listener failed:', error.message);
      }
    }
  });

  connected = true;
  console.log(`✅ Redis connected (${redisUrl})`);
}

function onRealtimeEvent(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

async function publishRealtime(type, data) {
  const event = {
    type,
    data,
    timestamp: new Date().toISOString(),
  };

  if (isRealtimeReady()) {
    try {
      await publisher.publish(REALTIME_CHANNEL, JSON.stringify(event));
      return;
    } catch (error) {
      console.error('Redis publish failed; falling back to local delivery:', error.message);
    }
  }

  for (const listener of listeners) {
    try {
      listener(event);
    } catch (error) {
      console.error('Realtime listener failed:', error.message);
    }
  }
}

async function setJson(key, value, ttlSeconds = 10) {
  if (!isRealtimeReady()) return false;
  try {
    await publisher.set(key, JSON.stringify(value), { EX: ttlSeconds });
    return true;
  } catch (error) {
    console.error(`Redis cache write failed for ${key}:`, error.message);
    return false;
  }
}

async function getJson(key) {
  if (!isRealtimeReady()) return null;
  try {
    const value = await publisher.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error(`Redis cache read failed for ${key}:`, error.message);
    return null;
  }
}

async function disconnectRealtime() {
  connected = false;
  await Promise.allSettled([
    subscriber?.quit(),
    publisher?.quit(),
  ]);
  subscriber = null;
  publisher = null;
}

module.exports = {
  REALTIME_CHANNEL,
  connectRealtime,
  disconnectRealtime,
  getJson,
  isRealtimeReady,
  onRealtimeEvent,
  publishRealtime,
  setJson,
};

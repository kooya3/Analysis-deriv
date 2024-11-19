'use client'

import DerivAPIBasic from '@deriv/deriv-api/dist/DerivAPIBasic';

let api: DerivAPIBasic | null = null;
let connection: WebSocket | null = null;
let connectionPromise: Promise<WebSocket> | null = null;

const WEBSOCKET_TIMEOUT = 10000; // 10 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

const createConnection = (retryCount = 0): Promise<WebSocket> => {
  if (connectionPromise) return connectionPromise;

  connectionPromise = new Promise((resolve, reject) => {
    const app_id = 65574;
    const ws = new WebSocket(`wss://ws.binaryws.com/websockets/v3?app_id=${app_id}`);
    
    const timeoutId = setTimeout(() => {
      ws.close();
      reject(new Error('WebSocket connection timeout'));
    }, WEBSOCKET_TIMEOUT);

    ws.onopen = () => {
      clearTimeout(timeoutId);
      connection = ws;
      console.log('Connected to Deriv API');
      resolve(ws);
    };

    ws.onerror = (error) => {
      clearTimeout(timeoutId);
      console.error('WebSocket error:', error);
      if (retryCount < MAX_RETRIES) {
        console.log(`Retrying connection (${retryCount + 1}/${MAX_RETRIES})...`);
        setTimeout(() => {
          connectionPromise = null;
          createConnection(retryCount + 1)
            .then(resolve)
            .catch(reject);
        }, RETRY_DELAY * Math.pow(2, retryCount));
      } else {
        reject(new Error('Failed to establish WebSocket connection after multiple attempts'));
      }
    };

    ws.onclose = () => {
      connection = null;
      connectionPromise = null;
    };
  });

  return connectionPromise;
};

export const connectDerivAPI = async (): Promise<DerivAPIBasic> => {
  if (api && connection?.readyState === WebSocket.OPEN) return api;

  try {
    const ws = await createConnection();
    api = new DerivAPIBasic({ connection: ws });
    return api;
  } catch (error) {
    console.error('Connection error:', error);
    throw error;
  }
};

export const subscribeTicks = async (symbol: string): Promise<any> => {
  const api = await connectDerivAPI();
  
  return new Promise((resolve, reject) => {
    if (!connection || connection.readyState !== WebSocket.OPEN) {
      reject(new Error('WebSocket connection not ready'));
      return;
    }

    const request = {
      ticks: symbol,
      subscribe: 1
    };
    
    let subscriptionId: string | null = null;
    
    const handler = {
      onUpdate: (callback: (data: any) => void) => {
        if (connection) {
          connection.onmessage = (msg) => {
            const data = JSON.parse(msg.data);
            if (data.msg_type === 'tick' && data.tick) {
              callback(data);
            }
            if (data.subscription?.id && !subscriptionId) {
              subscriptionId = data.subscription.id;
            }
          };
        }
      },
      unsubscribe: async () => {
        if (subscriptionId) {
          await api.forget(subscriptionId);
        }
      }
    };

    connection.send(JSON.stringify(request));
    resolve(handler);
  });
};

export const getCandles = async (symbol: string, interval: string, count: number): Promise<any> => {
  await connectDerivAPI();
  
  return new Promise((resolve, reject) => {
    if (!connection || connection.readyState !== WebSocket.OPEN) {
      reject(new Error('WebSocket connection not ready'));
      return;
    }

    const request = {
      ticks_history: symbol,
      adjust_start_time: 1,
      count: count,
      end: 'latest',
      start: 1,
      style: 'candles',
      granularity: parseInt(interval)
    };

    const messageHandler = (msg: MessageEvent) => {
      const data = JSON.parse(msg.data);
      if (data.msg_type === 'candles') {
        connection!.removeEventListener('message', messageHandler);
        resolve(data);
      } else if (data.error) {
        connection!.removeEventListener('message', messageHandler);
        reject(new Error(data.error.message));
      }
    };

    connection.addEventListener('message', messageHandler);
    connection.send(JSON.stringify(request));
  });
};

export const unsubscribeTicks = async (id: string): Promise<any> => {
  const api = await connectDerivAPI();
  return api.forget(id);
};

export const getSyntheticStats = async (symbol: string): Promise<any> => {
  await connectDerivAPI();

  return new Promise((resolve, reject) => {
    if (!connection || connection.readyState !== WebSocket.OPEN) {
      reject(new Error('WebSocket connection not ready'));
      return;
    }

    const request = {
      ticks_history: symbol,
      adjust_start_time: 1,
      count: 5000,
      end: 'latest',
      start: 1,
      style: 'ticks'
    };

    const messageHandler = (msg: MessageEvent) => {
      const data = JSON.parse(msg.data);
      if (data.msg_type === 'history') {
        connection!.removeEventListener('message', messageHandler);
        
        // Calculate stats from the received data
        const prices = data.history.prices;
        const stats = {
          symbol: symbol,
          last: prices[prices.length - 1],
          high: Math.max(...prices),
          low: Math.min(...prices),
          average: prices.reduce((a: number, b: number) => a + b, 0) / prices.length
        };
        
        resolve(stats);
      } else if (data.error) {
        connection!.removeEventListener('message', messageHandler);
        reject(new Error(data.error.message));
      }
    };

    connection.addEventListener('message', messageHandler);
    connection.send(JSON.stringify(request));
  });
};
'use client'

import DerivAPIBasic from '@deriv/deriv-api/dist/DerivAPIBasic';

let api: DerivAPIBasic | null = null;
let connection: WebSocket | null = null;

export const connectDerivAPI = async (): Promise<DerivAPIBasic> => {
  if (api && connection?.readyState === WebSocket.OPEN) return api;

  const app_id = 65574;
  connection = new WebSocket(`wss://ws.binaryws.com/websockets/v3?app_id=${app_id}`);
  
  api = new DerivAPIBasic({ connection });
  
  return new Promise((resolve, reject) => {
    if (!connection) return reject(new Error('Connection not initialized'));

    connection.onopen = () => {
      console.log('Connected to Deriv API');
      resolve(api!);
    };
    connection.onerror = (error) => {
      console.error('Connection error:', error);
      reject(error);
    };
  });
};

export const subscribeTicks = async (symbol: string): Promise<any> => {
  const api = await connectDerivAPI();
  const response = await api.subscribe({
    ticks: symbol,
    subscribe: 1
  });
  
  return {
    id: response.subscription?.id,
    onUpdate: (callback: (data: any) => void) => {
      if (connection) {
        connection.onmessage = (msg) => {
          const data = JSON.parse(msg.data);
          if (data.msg_type === 'tick' && data.tick) {
            callback(data);
          }
        };
      }
    },
    unsubscribe: async () => {
      if (response.subscription?.id) {
        await api.forget(response.subscription.id);
      }
    }
  };
};

export const getCandles = async (symbol: string, interval: string, count: number): Promise<any> => {
  const api = await connectDerivAPI();
  const request = {
    ticks_history: symbol,
    adjust_start_time: 1,
    count: count,
    end: 'latest',
    start: 1,
    style: 'candles',
    granularity: parseInt(interval)
  };
  
  return new Promise((resolve, reject) => {
    if (!connection) return reject(new Error('Connection not initialized'));
    
    connection.send(JSON.stringify(request));
    connection.onmessage = (msg) => {
      const data = JSON.parse(msg.data);
      if (data.msg_type === 'candles') {
        resolve(data);
      } else if (data.error) {
        reject(data.error);
      }
    };
  });
};

export const unsubscribeTicks = async (id: string): Promise<any> => {
  const api = await connectDerivAPI();
  return api.forget(id);
};
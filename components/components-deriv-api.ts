'use client'

import DerivAPIBasic from '@deriv/deriv-api/dist/DerivAPIBasic';

let api: DerivAPIBasic | null = null;
let connection: WebSocket | null = null;

export const connectDerivAPI = async (): Promise<DerivAPIBasic> => {
  if (api && connection?.readyState === WebSocket.OPEN) return api;

  const app_id = 1089; // Replace with your app_id
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
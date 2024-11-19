import WebSocket from 'ws';
import DerivAPIBasic from '@deriv/deriv-api/dist/DerivAPIBasic.js';

const app_id = 1089; // Public test app_id from Deriv documentation
const endpoint = 'wss://ws.binaryws.com/websockets/v3';

let connection;
let api;
let keepAliveInterval;

const createConnection = () => {
  console.log(`Connecting to ${endpoint}...`);
  connection = new WebSocket(`${endpoint}?app_id=${app_id}`);
  api = new DerivAPIBasic({ connection });

  connection.on('open', () => {
    console.log('WebSocket connection opened successfully');
    startKeepAlive();
    runTests();
  });

  connection.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log('Received message:', JSON.stringify(message, null, 2));
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });

  connection.on('error', (error) => {
    console.error('WebSocket error:', error);
  });

  connection.on('close', (code, reason) => {
    console.log(`Connection closed. Code: ${code}, Reason: ${reason || 'No reason provided'}`);
    clearInterval(keepAliveInterval);
  });
};

const startKeepAlive = () => {
  keepAliveInterval = setInterval(() => {
    if (connection.readyState === WebSocket.OPEN) {
      console.log('Sending keep-alive ping...');
      connection.ping();
    }
  }, 10000); // Send a ping every 10 seconds
};

const sendRequest = async (request) => {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Request timeout'));
    }, 10000); // 10 second timeout

    console.log(`Sending request: ${JSON.stringify(request)}`);
    api.send(request)
      .then((response) => {
        clearTimeout(timeout);
        console.log(`Response received:`, JSON.stringify(response, null, 2));
        resolve(response);
      })
      .catch((error) => {
        clearTimeout(timeout);
        console.error(`Error in request:`, error.message);
        reject(error);
      });
  });
};

const runTests = async () => {
  try {
    console.log('\nTesting ping...');
    await sendRequest({ ping: 1 });

    console.log('\nGetting website status...');
    await sendRequest({ website_status: 1 });

    console.log('\nGetting available symbols...');
    const symbolsResponse = await sendRequest({ 
      active_symbols: 'brief',
      product_type: 'basic'
    });

    if (symbolsResponse?.active_symbols) {
      const volatilityIndices = symbolsResponse.active_symbols
        .filter(s => s.market === 'synthetic_index')
        .map(s => s.symbol);
      console.log('\nAvailable Volatility Indices:', volatilityIndices);

      if (volatilityIndices.length > 0) {
        const symbol = volatilityIndices[0];
        console.log(`\nSubscribing to ticks for ${symbol}...`);
        await sendRequest({ ticks: symbol });
      }
    }

    // Keep the connection open for a while to receive some tick data
    console.log('\nWaiting for tick data...');
    await new Promise(resolve => setTimeout(resolve, 30000)); // Wait for 30 seconds

  } catch (error) {
    console.error('Test failed:', error.message);
  } finally {
    console.log('\nTests completed. Closing connection...');
    clearInterval(keepAliveInterval);
    connection.close();
  }
};

// Start the connection and tests
createConnection();

// Handle script termination
process.on('SIGINT', () => {
  console.log('\nReceived SIGINT. Closing connection...');
  clearInterval(keepAliveInterval);
  if (connection) connection.close();
  process.exit(0);
});
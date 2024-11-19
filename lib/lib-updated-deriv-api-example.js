import WebSocket from 'ws';
import DerivAPIBasic from '@deriv/deriv-api/dist/DerivAPIBasic.js';

const app_id = 65574;
const connection = new WebSocket(`wss://ws.binaryws.com/websockets/v3?app_id=${app_id}`);
const api = new DerivAPIBasic({ connection });

// Function to make an API request
const makeRequest = async (request) => {
  try {
    const response = await api.send(request);
    console.log('Response:', JSON.stringify(response, null, 2));
    return response;
  } catch (error) {
    console.error('Error:', error);
  }
};

// Example API calls
const getWebsiteStatus = () => makeRequest({ website_status: 1 });
const getActiveSymbols = () => makeRequest({ active_symbols: 'brief', product_type: 'basic' });
const getTicks = (symbol) => makeRequest({ ticks: symbol });

// Function to get historical ticks
const getTicksHistory = async (symbol, count = 100) => {
  return makeRequest({
    ticks_history: symbol,
    count: count,
    end: 'latest',
    style: 'ticks'
  });
};

// Main function to run our example
const runExample = async () => {
  console.log('Connecting to Deriv API...');
  
  // Wait for the connection to be established
  await new Promise(resolve => connection.onopen = resolve);
  console.log('Connected!');

  try {
    // Make API calls
    await getWebsiteStatus();
    const activeSymbols = await getActiveSymbols();
    
    if (activeSymbols && activeSymbols.active_symbols) {
      const firstSymbol = activeSymbols.active_symbols[0].symbol;
      console.log(`Fetching ticks for ${firstSymbol}`);
      await getTicks(firstSymbol);
      
      console.log(`Fetching historical ticks for ${firstSymbol}`);
      await getTicksHistory(firstSymbol);
    }
  } catch (error) {
    console.error('Error during API calls:', error);
  } finally {
    // Close the connection
    connection.close();
  }
};

runExample();
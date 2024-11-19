import WebSocket from 'ws';
import DerivAPIBasic from '@deriv/deriv-api/dist/DerivAPIBasic.js';

const app_id = 65574;
const connection = new WebSocket(`wss://ws.binaryws.com/websockets/v3?app_id=${app_id}`);
const api = new DerivAPIBasic({ connection });

// Function to make an API request with timeout and retry
const makeRequest = async (request, maxRetries = 3, timeout = 20000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Sending request (attempt ${attempt}): ${JSON.stringify(request)}`);
      const responsePromise = api.send(request);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), timeout)
      );
      const response = await Promise.race([responsePromise, timeoutPromise]);
      console.log('Response received:', JSON.stringify(response, null, 2));
      return response;
    } catch (error) {
      console.error(`Error in makeRequest (attempt ${attempt}):`, error.message);
      if (attempt === maxRetries) throw error;
      console.log(`Retrying in 5 seconds...`);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
};

// Example API calls
const getWebsiteStatus = () => makeRequest({ website_status: 1 });
const getActiveSymbols = () => makeRequest({ active_symbols: 'brief', product_type: 'basic' });
const getTicks = (symbol) => makeRequest({ ticks: symbol });

// Function to get historical candles
const getHistoricalCandles = async (symbol, interval = '1m', count = 100) => {
  return makeRequest({
    ticks_history: symbol,
    style: 'candles',
    granularity: interval,
    count: count,
    end: 'latest'
  });
};

// Main function to run our example
const runExample = async () => {
  console.log('Connecting to Deriv API...');
  
  try {
    // Wait for the connection to be established
    await new Promise((resolve, reject) => {
      connection.onopen = () => {
        console.log('WebSocket connection opened');
        resolve();
      };
      connection.onerror = (error) => {
        console.error('WebSocket connection error:', error);
        reject(error);
      };
      setTimeout(() => reject(new Error('Connection timeout')), 20000);
    });
    console.log('Connected!');

    // Make API calls
    console.log('Getting website status...');
    const websiteStatus = await getWebsiteStatus();
    console.log('Website status received');

    console.log('Getting active symbols...');
    const activeSymbols = await getActiveSymbols();
    console.log('Active symbols received');
    
    if (activeSymbols && activeSymbols.active_symbols) {
      const volatilityIndices = activeSymbols.active_symbols.filter(s => s.market === 'synthetic_index' && s.submarket === 'random_index');
      console.log('Available Volatility Indices:', volatilityIndices.map(s => s.symbol).join(', '));

      const selectedSymbol = volatilityIndices[0]?.symbol || 'R_100';
      console.log(`Selected symbol: ${selectedSymbol}`);

      console.log(`Fetching ticks for ${selectedSymbol}`);
      await getTicks(selectedSymbol);
      
      console.log(`Fetching historical candles for ${selectedSymbol}`);
      await getHistoricalCandles(selectedSymbol);
    } else {
      console.error('No active symbols found');
    }
  } catch (error) {
    console.error('Error during script execution:', error);
  } finally {
    // Close the connection
    console.log('Closing WebSocket connection...');
    connection.close();
    console.log('WebSocket connection closed');
  }
};

runExample();

// Add error event listener to the connection
connection.on('error', (error) => {
  console.error('WebSocket error:', error);
});

// Add close event listener to the connection
connection.on('close', (code, reason) => {
  console.log(`WebSocket closed with code ${code}. Reason: ${reason}`);
});
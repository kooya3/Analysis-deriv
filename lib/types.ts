export interface TickData {
    epoch: number;
    quote: number;
    symbol: string;
  }
  
  export interface PredictionResult {
    predictedDirection: 'up' | 'down';
    confidence: number;
    nextTickPrediction: number;
  }
  
  export interface TechnicalIndicators {
    rsi: number;
    macd: {
      macdLine: number;
      signalLine: number;
      histogram: number;
    };
    sma20: number;
    sma50: number;
    bollingerBands: {
      upper: number;
      middle: number;
      lower: number;
    };
  }
  
  export interface TradePosition {
    id: string;
    symbol: string;
    type: 'CALL' | 'PUT';
    amount: number;
    entryPrice: number;
    entryTime: Date;
    duration: number; // in seconds
    status: 'open' | 'won' | 'lost';
  }
  
  export interface HistoricalData {
    ticks: TickData[];
    predictions: PredictionResult[];
    accuracy: number;
  }
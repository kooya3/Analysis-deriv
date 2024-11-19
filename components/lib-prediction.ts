'use client'

import { TickData, PredictionResult, TechnicalIndicators } from './types';

export function calculateTechnicalIndicators(ticks: TickData[]): TechnicalIndicators {
  const prices = ticks.map(t => t.quote);
  
  // Calculate RSI
  const rsi = calculateRSI(prices, 14);
  
  // Calculate MACD
  const macd = calculateMACD(prices);
  
  // Calculate SMAs
  const sma20 = calculateSMA(prices, 20);
  const sma50 = calculateSMA(prices, 50);
  
  // Calculate Bollinger Bands
  const bollingerBands = calculateBollingerBands(prices, 20, 2);
  
  return {
    rsi,
    macd,
    sma20,
    sma50,
    bollingerBands,
  };
}

export function predictNextTick(
  ticks: TickData[],
  indicators: TechnicalIndicators
): PredictionResult {
  const lastPrice = ticks[ticks.length - 1].quote;
  
  // Combine multiple signals for prediction
  const signals = [
    // RSI signals
    indicators.rsi > 70 ? -1 : indicators.rsi < 30 ? 1 : 0,
    
    // MACD signals
    indicators.macd.macdLine > indicators.macd.signalLine ? 1 : -1,
    
    // SMA signals
    lastPrice > indicators.sma20 ? 1 : -1,
    
    // Bollinger Bands signals
    lastPrice > indicators.bollingerBands.upper ? -1 :
    lastPrice < indicators.bollingerBands.lower ? 1 : 0
  ];
  
  // Calculate overall signal strength
  const signalStrength = signals.reduce((acc, val) => acc + val, 0);
  const maxStrength = signals.length;
  
  // Calculate confidence
  const confidence = Math.abs(signalStrength) / maxStrength;
  
  // Predict direction and next tick value
  const predictedDirection = signalStrength > 0 ? 'up' : 'down';
  const volatility = calculateVolatility(ticks);
  const expectedMove = volatility * (confidence * 0.5);
  const nextTickPrediction = predictedDirection === 'up' ? 
    lastPrice + expectedMove : 
    lastPrice - expectedMove;
  
  return {
    predictedDirection,
    confidence,
    nextTickPrediction
  };
}

// Helper functions
function calculateRSI(prices: number[], period: number): number {
  if (prices.length < period + 1) return 50;
  
  let gains = 0;
  let losses = 0;
  
  for (let i = 1; i <= period; i++) {
    const difference = prices[prices.length - i] - prices[prices.length - i - 1];
    if (difference >= 0) {
      gains += difference;
    } else {
      losses -= difference;
    }
  }
  
  const avgGain = gains / period;
  const avgLoss = losses / period;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

function calculateMACD(prices: number[]): { macdLine: number; signalLine: number; histogram: number; } {
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  const macdLine = ema12 - ema26;
  const signalLine = calculateEMA([macdLine], 9);
  const histogram = macdLine - signalLine;
  
  return { macdLine, signalLine, histogram };
}

function calculateSMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1];
  const sum = prices.slice(-period).reduce((acc, price) => acc + price, 0);
  return sum / period;
}

function calculateEMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1];
  
  const multiplier = 2 / (period + 1);
  let ema = prices[0];
  
  for (let i = 1; i < prices.length; i++) {
    ema = (prices[i] - ema) * multiplier + ema;
  }
  
  return ema;
}

function calculateBollingerBands(prices: number[], period: number, stdDev: number) {
  const sma = calculateSMA(prices, period);
  const squared = prices.map(p => Math.pow(p - sma, 2));
  const std = Math.sqrt(squared.reduce((a, b) => a + b) / period);
  
  return {
    upper: sma + (std * stdDev),
    middle: sma,
    lower: sma - (std * stdDev)
  };
}

function calculateVolatility(ticks: TickData[]): number {
  const prices = ticks.map(t => t.quote);
  const returns = prices.slice(1).map((price, i) => 
    Math.log(price / prices[i])
  );
  
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const squaredDiffs = returns.map(r => Math.pow(r - mean, 2));
  return Math.sqrt(squaredDiffs.reduce((a, b) => a + b) / returns.length);
}
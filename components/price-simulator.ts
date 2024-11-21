'use client'

export class PriceSimulator {
  private currentPrice: number;
  private volatility: number;
  private trend: number;

  constructor(initialPrice: number, volatility: number, trend: number) {
    this.currentPrice = initialPrice;
    this.volatility = volatility;
    this.trend = trend;
  }

  nextPrice(): number {
    const randomFactor = Math.random() - 0.5;
    const volatilityComponent = this.volatility * randomFactor;
    const trendComponent = this.trend * (Math.random() - 0.5);
    
    const priceChange = this.currentPrice * (volatilityComponent + trendComponent);
    this.currentPrice += priceChange;
    
    return Math.max(0, this.currentPrice); // Ensure price doesn't go negative
  }

  getCurrentPrice(): number {
    return this.currentPrice;
  }

  setVolatility(volatility: number): void {
    this.volatility = volatility;
  }

  setTrend(trend: number): void {
    this.trend = trend;
  }
}

export function createPriceSimulator(initialPrice: number, volatility: number, trend: number): PriceSimulator {
  return new PriceSimulator(initialPrice, volatility, trend);
}
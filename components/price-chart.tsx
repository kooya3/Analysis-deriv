'use client'

import React, { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi, UTCTimestamp } from 'lightweight-charts';
import { subscribeTicks, unsubscribeTicks, getCandles } from './deriv-api';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from 'lucide-react'

interface PriceChartProps {
  symbol: string;
  interval: string;
}

export function PriceChart({ symbol, interval }: PriceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState(symbol);
  const [selectedInterval, setSelectedInterval] = useState(interval);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (chartContainerRef.current) {
      chartRef.current = createChart(chartContainerRef.current, {
        width: chartContainerRef.current.clientWidth,
        height: 400,
        layout: {
          background: { type: 'solid', color: '#ffffff' },
          textColor: '#333',
        },
        grid: {
          vertLines: { color: '#f0f0f0' },
          horzLines: { color: '#f0f0f0' },
        },
        timeScale: {
          timeVisible: true,
          secondsVisible: false,
        },
      });
      candleSeriesRef.current = chartRef.current.addCandlestickSeries();
    }

    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        chartRef.current.applyOptions({ 
          width: chartContainerRef.current.clientWidth 
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
      }
    };
  }, []);

  useEffect(() => {
    let tickSubscription: any;
    setError(null);

    const fetchInitialData = async () => {
      try {
        const response = await getCandles(selectedSymbol, selectedInterval, 100);
        if (response.error) {
          throw new Error(response.error.message);
        }
        
        const candles = response.candles.map((candle: any) => ({
          time: candle.epoch as UTCTimestamp,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
        }));

        if (candleSeriesRef.current) {
          candleSeriesRef.current.setData(candles);
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch chart data');
      }
    };

    const subscribeToTicks = async () => {
      try {
        tickSubscription = await subscribeTicks(selectedSymbol);
        tickSubscription.onUpdate((data: any) => {
          if (candleSeriesRef.current && data.tick) {
            const tick = data.tick;
            candleSeriesRef.current.update({
              time: tick.epoch as UTCTimestamp,
              open: tick.quote,
              high: tick.quote,
              low: tick.quote,
              close: tick.quote,
            });
          }
        });
      } catch (error) {
        console.error('Error subscribing to ticks:', error);
        setError(error instanceof Error ? error.message : 'Failed to subscribe to price updates');
      }
    };

    fetchInitialData();
    subscribeToTicks();

    return () => {
      if (tickSubscription) {
        tickSubscription.unsubscribe().catch(console.error);
      }
    };
  }, [selectedSymbol, selectedInterval]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Price Chart</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex space-x-4 mb-4">
          <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select symbol" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="R_10">Volatility 10 Index</SelectItem>
              <SelectItem value="R_25">Volatility 25 Index</SelectItem>
              <SelectItem value="R_50">Volatility 50 Index</SelectItem>
              <SelectItem value="R_75">Volatility 75 Index</SelectItem>
              <SelectItem value="R_100">Volatility 100 Index</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedInterval} onValueChange={setSelectedInterval}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select interval" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="60">1 minute</SelectItem>
              <SelectItem value="300">5 minutes</SelectItem>
              <SelectItem value="900">15 minutes</SelectItem>
              <SelectItem value="1800">30 minutes</SelectItem>
              <SelectItem value="3600">1 hour</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div ref={chartContainerRef} className="w-full h-[400px]" />
      </CardContent>
    </Card>
  );
}
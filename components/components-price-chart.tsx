'use client'

import React, { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi, UTCTimestamp } from 'lightweight-charts';
import { subscribeTicks, unsubscribeTicks, getCandles } from './deriv-api';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2 } from 'lucide-react'

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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (chartContainerRef.current && !chartRef.current) {
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
        chartRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    let tickSubscription: any;
    let retryTimeout: NodeJS.Timeout;
    let isSubscribed = true;

    const initializeChart = async (retryCount = 0) => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await getCandles(selectedSymbol, selectedInterval, 100);
        if (!isSubscribed) return;

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

        tickSubscription = await subscribeTicks(selectedSymbol);
        tickSubscription.onUpdate((data: any) => {
          if (!isSubscribed || !candleSeriesRef.current || !data.tick) return;
          
          candleSeriesRef.current.update({
            time: data.tick.epoch as UTCTimestamp,
            open: data.tick.quote,
            high: data.tick.quote,
            low: data.tick.quote,
            close: data.tick.quote,
          });
        });

        setIsLoading(false);
      } catch (error) {
        console.error('Chart initialization error:', error);
        if (!isSubscribed) return;

        if (retryCount < 3) {
          setError(`Connection attempt ${retryCount + 1}/3...`);
          retryTimeout = setTimeout(() => {
            initializeChart(retryCount + 1);
          }, 2000 * Math.pow(2, retryCount));
        } else {
          setError('Failed to load chart data. Please try again later.');
          setIsLoading(false);
        }
      }
    };

    initializeChart();

    return () => {
      isSubscribed = false;
      clearTimeout(retryTimeout);
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
        
        <div className="relative">
          <div ref={chartContainerRef} className="w-full h-[400px]" />
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50">
              <div className="flex items-center space-x-2">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>Loading chart data...</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
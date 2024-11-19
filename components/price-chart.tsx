'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createChart, IChartApi, ISeriesApi, UTCTimestamp } from 'lightweight-charts';
import { subscribeTicks, unsubscribeTicks, getCandles, getSyntheticStats } from './deriv-api';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react'
import { Button } from "@/components/ui/button"

interface PriceChartProps {
  symbol: string;
  interval: string;
}

interface SyntheticStats {
  symbol: string;
  last: number;
  high: number;
  low: number;
  average: number;
}

export function PriceChart({ symbol, interval }: PriceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState(symbol);
  const [selectedInterval, setSelectedInterval] = useState(interval);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<SyntheticStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  useEffect(() => {
    if (chartContainerRef.current && !chartRef.current) {
      chartRef.current = createChart(chartContainerRef.current, {
        width: chartContainerRef.current.clientWidth,
        height: 400,
        layout: {
          background: { type: 'solid', color: '#1f2937' },
          textColor: '#e5e7eb',
        },
        grid: {
          vertLines: { color: '#374151' },
          horzLines: { color: '#374151' },
        },
        timeScale: {
          timeVisible: true,
          secondsVisible: false,
        },
      });
      candleSeriesRef.current = chartRef.current.addCandlestickSeries({
        upColor: '#10b981',
        downColor: '#ef4444',
        borderUpColor: '#10b981',
        borderDownColor: '#ef4444',
        wickUpColor: '#10b981',
        wickDownColor: '#ef4444',
      });
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

  const fetchSyntheticStats = useCallback(async () => {
    setIsLoadingStats(true);
    try {
      const fetchedStats = await getSyntheticStats(selectedSymbol);
      setStats(fetchedStats);
    } catch (error) {
      console.error('Error fetching synthetic stats:', error);
      setError('Failed to fetch market statistics');
    } finally {
      setIsLoadingStats(false);
    }
  }, [selectedSymbol]);

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
        fetchSyntheticStats();
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
  }, [selectedSymbol, selectedInterval, fetchSyntheticStats]);

  return (
    <Card className="bg-gray-800 text-gray-100">
      <CardHeader>
        <CardTitle>Price Chart</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex space-x-4 mb-4">
          <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
            <SelectTrigger className="w-[180px] bg-gray-700 text-gray-100 border-gray-600">
              <SelectValue placeholder="Select symbol" />
            </SelectTrigger>
            <SelectContent className="bg-gray-700 text-gray-100 border-gray-600">
              <SelectItem value="R_10">Volatility 10 Index</SelectItem>
              <SelectItem value="R_25">Volatility 25 Index</SelectItem>
              <SelectItem value="R_50">Volatility 50 Index</SelectItem>
              <SelectItem value="R_75">Volatility 75 Index</SelectItem>
              <SelectItem value="R_100">Volatility 100 Index</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedInterval} onValueChange={setSelectedInterval}>
            <SelectTrigger className="w-[180px] bg-gray-700 text-gray-100 border-gray-600">
              <SelectValue placeholder="Select interval" />
            </SelectTrigger>
            <SelectContent className="bg-gray-700 text-gray-100 border-gray-600">
              <SelectItem value="60">1 minute</SelectItem>
              <SelectItem value="300">5 minutes</SelectItem>
              <SelectItem value="900">15 minutes</SelectItem>
              <SelectItem value="1800">30 minutes</SelectItem>
              <SelectItem value="3600">1 hour</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {error && (
          <Alert variant="destructive" className="mb-4 bg-red-900 border-red-700 text-red-100">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="relative mb-4">
          <div ref={chartContainerRef} className="w-full h-[400px]" />
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800/50">
              <div className="flex items-center space-x-2 text-gray-100">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>Loading chart data...</span>
              </div>
            </div>
          )}
        </div>

        {stats && (
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-700 p-4 rounded-lg">
              <p className="text-gray-400">Last Price</p>
              <p className="text-2xl font-bold">{stats.last.toFixed(3)}</p>
            </div>
            <div className="bg-gray-700 p-4 rounded-lg">
              <p className="text-gray-400">24h High</p>
              <p className="text-2xl font-bold text-green-500">{stats.high.toFixed(3)}</p>
            </div>
            <div className="bg-gray-700 p-4 rounded-lg">
              <p className="text-gray-400">24h Low</p>
              <p className="text-2xl font-bold text-red-500">{stats.low.toFixed(3)}</p>
            </div>
            <div className="bg-gray-700 p-4 rounded-lg">
              <p className="text-gray-400">24h Average</p>
              <p className="text-2xl font-bold">{stats.average.toFixed(3)}</p>
            </div>
          </div>
        )}

        <Button 
          onClick={fetchSyntheticStats} 
          variant="outline" 
          size="sm"
          className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
          disabled={isLoadingStats}
        >
          {isLoadingStats ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Refreshing Stats...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Stats
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
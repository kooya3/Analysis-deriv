'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { createChart, IChartApi, ISeriesApi, UTCTimestamp } from 'lightweight-charts'
import { subscribeTicks, unsubscribeTicks, getCandles, getSyntheticStats } from './deriv-api'
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

const MARKET_SYMBOLS = [
  { value: 'V10_1S', apiSymbol: 'R_10', label: 'Volatility 10 Index' },
  { value: 'V25_1S', apiSymbol: 'R_25', label: 'Volatility 25 Index' },
  { value: 'V50_1S', apiSymbol: 'R_50', label: 'Volatility 50 Index' },
  { value: 'V75_1S', apiSymbol: 'R_75', label: 'Volatility 75 Index' },
  { value: 'V100_1S', apiSymbol: 'R_100', label: 'Volatility 100 Index' },
]

export function PriceChart({ symbol = 'V25_1S', interval = '1800' }: PriceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null)
  const [selectedSymbol, setSelectedSymbol] = useState(symbol)
  const [selectedInterval, setSelectedInterval] = useState(interval)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<SyntheticStats | null>(null)
  const [isLoadingStats, setIsLoadingStats] = useState(false)

  const getApiSymbol = useCallback((uiSymbol: string) => {
    return MARKET_SYMBOLS.find(m => m.value === uiSymbol)?.apiSymbol || uiSymbol
  }, [])

  const initializeChart = useCallback(() => {
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
      })
      candleSeriesRef.current = chartRef.current.addCandlestickSeries({
        upColor: '#10b981',
        downColor: '#ef4444',
        borderUpColor: '#10b981',
        borderDownColor: '#ef4444',
        wickUpColor: '#10b981',
        wickDownColor: '#ef4444',
      })
    }
  }, [])

  const fetchSyntheticStats = useCallback(async () => {
    setIsLoadingStats(true)
    setError(null)
    try {
      const apiSymbol = getApiSymbol(selectedSymbol)
      const fetchedStats = await getSyntheticStats(apiSymbol)
      setStats(fetchedStats)
    } catch (error) {
      console.error('Error fetching synthetic stats:', error)
      setError('Failed to fetch market statistics. Please try again.')
    } finally {
      setIsLoadingStats(false)
    }
  }, [selectedSymbol, getApiSymbol])

  const updateChartData = useCallback(async () => {
    if (!candleSeriesRef.current) return

    setIsLoading(true)
    setError(null)
    try {
      const apiSymbol = getApiSymbol(selectedSymbol)
      const response = await getCandles(apiSymbol, selectedInterval, 100)
      
      const candles = response.candles.map((candle: any) => ({
        time: candle.epoch as UTCTimestamp,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
      }))

      candleSeriesRef.current.setData(candles)
      setIsLoading(false)
    } catch (error) {
      console.error('Error updating chart data:', error)
      setError('Failed to update chart data. Please try again.')
      setIsLoading(false)
    }
  }, [selectedSymbol, selectedInterval, getApiSymbol])

  useEffect(() => {
    initializeChart()
    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        chartRef.current.applyOptions({ 
          width: chartContainerRef.current.clientWidth 
        })
      }
    }

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      if (chartRef.current) {
        chartRef.current.remove()
        chartRef.current = null
      }
    }
  }, [initializeChart])

  useEffect(() => {
    let tickSubscription: any

    const setupTickSubscription = async () => {
      const apiSymbol = getApiSymbol(selectedSymbol)
      tickSubscription = await subscribeTicks(apiSymbol)
      tickSubscription.onUpdate((data: any) => {
        if (!candleSeriesRef.current || !data.tick) return
        
        candleSeriesRef.current.update({
          time: data.tick.epoch as UTCTimestamp,
          open: data.tick.quote,
          high: data.tick.quote,
          low: data.tick.quote,
          close: data.tick.quote,
        })
      })
    }

    updateChartData()
    fetchSyntheticStats()
    setupTickSubscription()

    return () => {
      if (tickSubscription) {
        tickSubscription.unsubscribe().catch(console.error)
      }
    }
  }, [selectedSymbol, selectedInterval, updateChartData, fetchSyntheticStats, getApiSymbol])

  const handleSymbolChange = (value: string) => {
    setSelectedSymbol(value)
  }

  const handleIntervalChange = (value: string) => {
    setSelectedInterval(value)
  }

  return (
    <Card className="bg-gray-800 text-gray-100">
      <CardHeader>
        <CardTitle>Price Chart</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex space-x-4 mb-4">
          <Select value={selectedSymbol} onValueChange={handleSymbolChange}>
            <SelectTrigger className="w-[180px] bg-gray-700 text-gray-100 border-gray-600">
              <SelectValue placeholder="Select symbol" />
            </SelectTrigger>
            <SelectContent className="bg-gray-700 text-gray-100 border-gray-600">
              {MARKET_SYMBOLS.map((market) => (
                <SelectItem key={market.value} value={market.value}>
                  {market.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedInterval} onValueChange={handleIntervalChange}>
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
          <div className="grid grid-cols-2 gap-4 mb-6">
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
          size="lg"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg py-6 rounded-lg shadow-lg transition-all hover:shadow-xl active:transform active:scale-95"
          disabled={isLoadingStats}
        >
          {isLoadingStats ? (
            <>
              <RefreshCw className="mr-3 h-6 w-6 animate-spin" />
              Refreshing Market Data...
            </>
          ) : (
            <>
              <RefreshCw className="mr-3 h-6 w-6" />
              Refresh Market Data
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}

export default PriceChart
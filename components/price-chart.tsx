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
  const tickSubscriptionRef = useRef<any>(null)
  const [selectedSymbol, setSelectedSymbol] = useState(symbol)
  const [selectedInterval, setSelectedInterval] = useState(interval)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<SyntheticStats | null>(null)
  const [isLoadingStats, setIsLoadingStats] = useState(false)
  const [isConnected, setIsConnected] = useState(false)

  const getApiSymbol = useCallback((uiSymbol: string) => {
    return MARKET_SYMBOLS.find(m => m.value === uiSymbol)?.apiSymbol || uiSymbol
  }, [])

  const cleanupChart = useCallback(() => {
    if (chartRef.current) {
      chartRef.current.remove()
      chartRef.current = null
    }
    candleSeriesRef.current = null
  }, [])

  const cleanupSubscription = useCallback(async () => {
    if (tickSubscriptionRef.current) {
      try {
        await unsubscribeTicks(tickSubscriptionRef.current)
      } catch (error) {
        console.error('Error unsubscribing:', error)
      }
      tickSubscriptionRef.current = null
    }
  }, [])

  const initializeChart = useCallback(() => {
    if (!chartContainerRef.current || chartRef.current) return

    try {
      const chart = createChart(chartContainerRef.current, {
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

      chartRef.current = chart
      candleSeriesRef.current = chart.addCandlestickSeries({
        upColor: '#10b981',
        downColor: '#ef4444',
        borderUpColor: '#10b981',
        borderDownColor: '#ef4444',
        wickUpColor: '#10b981',
        wickDownColor: '#ef4444',
      })

      setError(null)
    } catch (err) {
      setError('Failed to initialize chart. Please refresh the page.')
      console.error('Chart initialization error:', err)
    }
  }, [])

  const updateChartData = useCallback(async () => {
    if (!candleSeriesRef.current) return

    setIsLoading(true)
    setError(null)
    
    try {
      const apiSymbol = getApiSymbol(selectedSymbol)
      const response = await getCandles(apiSymbol, selectedInterval, 100)
      
      if (!response?.candles || !Array.isArray(response.candles)) {
        throw new Error('Invalid candle data received')
      }

      const candles = response.candles.map((candle: any) => ({
        time: (candle.epoch || 0) as UTCTimestamp,
        open: candle.open || 0,
        high: candle.high || 0,
        low: candle.low || 0,
        close: candle.close || 0,
      }))

      if (candleSeriesRef.current) {
        candleSeriesRef.current.setData(candles)
      }

      setIsConnected(true)
      setError(null)
    } catch (error) {
      console.error('Error updating chart data:', error)
      setError('Failed to update chart data. Please try again.')
      setIsConnected(false)
    } finally {
      setIsLoading(false)
    }
  }, [selectedSymbol, selectedInterval, getApiSymbol])

  const setupTickSubscription = useCallback(async () => {
    await cleanupSubscription()

    try {
      const apiSymbol = getApiSymbol(selectedSymbol)
      tickSubscriptionRef.current = await subscribeTicks(apiSymbol)
      
      if (!tickSubscriptionRef.current) {
        throw new Error('Failed to create subscription')
      }

      tickSubscriptionRef.current.onUpdate((data: any) => {
        if (!candleSeriesRef.current || !data?.tick?.epoch || !data?.tick?.quote) return
        
        candleSeriesRef.current.update({
          time: data.tick.epoch as UTCTimestamp,
          open: data.tick.quote,
          high: data.tick.quote,
          low: data.tick.quote,
          close: data.tick.quote,
        })
      })

      setIsConnected(true)
      setError(null)
    } catch (error) {
      console.error('Error setting up tick subscription:', error)
      setError('Failed to connect to market data. Please try again.')
      setIsConnected(false)
    }
  }, [selectedSymbol, getApiSymbol, cleanupSubscription])

  const handleRetryConnection = useCallback(async () => {
    setError(null)
    cleanupChart()
    initializeChart()
    await updateChartData()
    await setupTickSubscription()
  }, [cleanupChart, initializeChart, updateChartData, setupTickSubscription])

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
      cleanupChart()
    }
  }, [initializeChart, cleanupChart])

  useEffect(() => {
    const setupChart = async () => {
      await cleanupSubscription()
      await updateChartData()
      await setupTickSubscription()
    }

    setupChart()

    return () => {
      cleanupSubscription()
    }
  }, [selectedSymbol, selectedInterval, updateChartData, setupTickSubscription, cleanupSubscription])

  const handleSymbolChange = (value: string) => {
    setSelectedSymbol(value)
  }

  const handleIntervalChange = (value: string) => {
    setSelectedInterval(value)
  }

  return (
    <Card className="bg-gray-800 text-gray-100">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Price Chart</CardTitle>
          <div className="flex items-center space-x-2">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              isConnected ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
            }`}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
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
          <Alert variant="destructive" className="mb-4 bg-red-900/50 border-red-700">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="relative mb-4">
          <div ref={chartContainerRef} className="w-full h-[400px]" />
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800/50">
              <div className="flex items-center space-x-2">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>Loading chart data...</span>
              </div>
            </div>
          )}
        </div>

        {error && (
          <Button 
            onClick={handleRetryConnection}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            Retry Connection
          </Button>
        )}

        {stats && (
          <div className="grid grid-cols-2 gap-4 mt-4">
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
      </CardContent>
    </Card>
  )
}

export default PriceChart
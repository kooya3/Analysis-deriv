"use client"

import { useState, useEffect, useCallback } from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { connectDerivAPI } from './deriv-api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { AlertCircle, TrendingUp, Pause, Play, RefreshCw, ChevronUp, ChevronDown } from 'lucide-react'
import { TickData, PredictionResult, TechnicalIndicators, TradePosition } from '../lib/types'
import { calculateTechnicalIndicators, predictNextTick } from '../lib/prediction'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const TRADING_PAIRS = [
  { value: 'WLDAUD', label: 'AUD Basket' },
  { value: 'WLDEUR', label: 'EUR Basket' },
  { value: 'WLDUSD', label: 'USD Basket' },
]

const TIMEFRAMES = [
  { value: '60', label: '1 Minute' },
  { value: '300', label: '5 Minutes' },
  { value: '900', label: '15 Minutes' },
]

export function LiveTradingAnalysis() {
  const [tickData, setTickData] = useState<TickData[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [selectedPair, setSelectedPair] = useState('WLDAUD')
  const [timeframe, setTimeframe] = useState('60')
  const [isLoading, setIsLoading] = useState(true)
  const [prediction, setPrediction] = useState<PredictionResult | null>(null)
  const [indicators, setIndicators] = useState<TechnicalIndicators | null>(null)
  const [positions, setPositions] = useState<TradePosition[]>([])

  const updateChart = useCallback((newTick: TickData) => {
    setTickData(prevData => {
      const newData = [...prevData, newTick].slice(-100)
      const newIndicators = calculateTechnicalIndicators(newData)
      setIndicators(newIndicators)
      const newPrediction = predictNextTick(newData, newIndicators)
      setPrediction(newPrediction)
      return newData
    })
  }, [])

  useEffect(() => {
    let tickSubscription: any = null;
    let isSubscribed = true;

    const initializeChart = async () => {
      try {
        setIsLoading(true)
        const api = await connectDerivAPI()
        setIsConnected(true)

        const response = await api.send({ ticks: selectedPair, subscribe: 1 })
        
        if (!response.error) {
          tickSubscription = response.subscription
          
          api.onMessage().subscribe(({ data }: { data: any }) => {
            if (!isSubscribed || isPaused) return
            
            if (data.tick) {
              const newTick: TickData = {
                epoch: data.tick.epoch,
                quote: data.tick.quote,
                symbol: data.tick.symbol
              }
              updateChart(newTick)
            }
          })
        } else {
          setError(`API Error: ${response.error.message}`)
        }
      } catch (error) {
        console.error('Error initializing chart:', error)
        setError('Failed to connect to trading API. Please try again later.')
        setIsConnected(false)
      } finally {
        setIsLoading(false)
      }
    }

    initializeChart()

    return () => {
      isSubscribed = false
      if (tickSubscription) {
        tickSubscription.unsubscribe()
      }
    }
  }, [selectedPair, isPaused, updateChart])

  const handleReset = () => {
    setTickData([])
    setPrediction(null)
    setIndicators(null)
  }

  const handleTrade = (type: 'CALL' | 'PUT') => {
    if (!prediction) return

    const newPosition: TradePosition = {
      id: Date.now().toString(),
      symbol: selectedPair,
      type,
      amount: 10, // Example amount
      entryPrice: tickData[tickData.length - 1].quote,
      entryTime: new Date(),
      duration: parseInt(timeframe),
      status: 'open'
    }

    setPositions(prevPositions => [...prevPositions, newPosition])

    // Simulate trade outcome after duration
    setTimeout(() => {
      setPositions(prevPositions => 
        prevPositions.map(pos => 
          pos.id === newPosition.id
            ? { ...pos, status: Math.random() > 0.5 ? 'won' : 'lost' }
            : pos
        )
      )
    }, newPosition.duration * 1000)
  }

  const chartData = {
    labels: tickData.map(tick => new Date(tick.epoch * 1000).toLocaleTimeString()),
    datasets: [
      {
        label: `${TRADING_PAIRS.find(p => p.value === selectedPair)?.label} Price`,
        data: tickData.map(tick => tick.quote),
        borderColor: 'hsl(var(--primary))',
        backgroundColor: 'hsl(var(--primary) / 0.1)',
        tension: 0.1,
        fill: true,
      }
    ]
  }

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `Live ${TRADING_PAIRS.find(p => p.value === selectedPair)?.label} Price`,
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Time'
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Price'
        }
      }
    }
  }

  const latestTick = tickData[tickData.length - 1]
  const previousTick = tickData[tickData.length - 2]
  const priceChange = latestTick && previousTick ? latestTick.quote - previousTick.quote : 0
  const priceDirection = priceChange >= 0 ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-2">
              <CardTitle className="text-2xl font-bold">Live Trading Analysis</CardTitle>
              <CardDescription>Real-time price updates and predictions</CardDescription>
            </div>
            {isConnected && latestTick && (
              <Badge variant={priceChange >= 0 ? "default" : "destructive"} className="text-sm">
                {priceDirection}
                {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(5)}
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap gap-4 mt-4">
            <Select value={selectedPair} onValueChange={setSelectedPair}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select pair" />
              </SelectTrigger>
              <SelectContent>
                {TRADING_PAIRS.map((pair) => (
                  <SelectItem key={pair.value} value={pair.value}>
                    {pair.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select timeframe" />
              </SelectTrigger>
              <SelectContent>
                {TIMEFRAMES.map((tf) => (
                  <SelectItem key={tf.value} value={tf.value}>
                    {tf.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsPaused(!isPaused)}
              >
                {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleReset}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="bg-destructive/15 text-destructive p-4 rounded-lg flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              {error}
            </div>
          ) : (
            <>
              <div className="bg-card p-4 rounded-lg shadow mb-6 min-h-[400px] relative">
                {isLoading ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Loading chart data...
                    </div>
                  </div>
                ) : (
                  <Line data={chartData} options={options} />
                )}
              </div>
              {isConnected && tickData.length > 0 && (
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="prediction">Prediction</TabsTrigger>
                    <TabsTrigger value="indicators">Indicators</TabsTrigger>
                    <TabsTrigger value="positions">Positions</TabsTrigger>
                  </TabsList>
                  <TabsContent value="overview">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Latest Tick Data</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">Time: {latestTick && new Date(latestTick.epoch * 1000).toLocaleString()}</p>
                        <p className="text-2xl font-bold">{latestTick?.quote.toFixed(5)}</p>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  <TabsContent value="prediction">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Next Tick Prediction</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {prediction ? (
                          <>
                            <p className="text-sm text-muted-foreground">Direction: {prediction.predictedDirection}</p>
                            <p className="text-sm text-muted-foreground">Confidence: {(prediction.confidence * 100).toFixed(2)}%</p>
                            <p className="text-2xl font-bold">{prediction.nextTickPrediction.toFixed(5)}</p>
                            <div className="flex gap-2 mt-4">
                              <Button onClick={() => handleTrade('CALL')} variant="default">Call</Button>
                              <Button onClick={() => handleTrade('PUT')} variant="destructive">Put</Button>
                            </div>
                          </>
                        ) : (
                          <p>Not enough data for prediction</p>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                  <TabsContent value="indicators">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Technical Indicators</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {indicators ? (
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm font-semibold">RSI</p>
                              <p className="text-lg">{indicators.rsi.toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="text-sm font-semibold">MACD</p>
                              <p className="text-lg">{indicators.macd.macdLine.toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="text-sm font-semibold">SMA 20</p>
                              <p className="text-lg">{indicators.sma20.toFixed(5)}</p>
                            </div>
                            <div>
                              <p className="text-sm font-semibold">SMA 50</p>
                              <p className="text-lg">{indicators.sma50.toFixed(5)}</p>
                            </div>
                            <div>
                              <p className="text-sm font-semibold">Bollinger Bands</p>
                              <p className="text-sm">Upper: {indicators.bollingerBands.upper.toFixed(5)}</p>
                              <p className="text-sm">Middle: {indicators.bollingerBands.middle.toFixed(5)}</p>
                              <p className="text-sm">Lower: {indicators.bollingerBands.lower.toFixed(5)}</p>
                            </div>
                          </div>
                        ) : (
                          <p>Not enough data for indicators</p>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                  <TabsContent value="positions">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Open Positions</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {positions.length > 0 ? (
                          <div className="space-y-4">
                            {positions.map(position => (
                              <div key={position.id} className="flex justify-between items-center">
                                <div>
                                  <p className="font-semibold">{position.symbol} - {position.type}</p>
                                  <p className="text-sm text-muted-foreground">
                                    Entry: {position.entryPrice.toFixed(5)} at {position.entryTime.toLocaleTimeString()}
                                  </p>
                                </div>
                                <Badge variant={position.status === 'open' ? 'default' : position.status === 'won' ? 'success' : 'destructive'}>
                                  {position.status}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p>No open positions</p>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
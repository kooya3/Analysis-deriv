"use client"

import { useState, useEffect } from 'react'
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
import { connectDerivAPI, subscribeToTicks } from './deriv-api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { AlertCircle, TrendingUp, Pause, Play, RefreshCw, ChevronUp, ChevronDown } from 'lucide-react'

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

export function LiveChartComponent() {
  const [tickData, setTickData] = useState<Array<{ time: Date; price: number }>>([])
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [selectedPair, setSelectedPair] = useState('WLDAUD')
  const [timeframe, setTimeframe] = useState('60')
  const [isLoading, setIsLoading] = useState(true)

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
              setTickData(prevData => {
                const newData = [...prevData, { 
                  time: new Date(data.tick.epoch * 1000), 
                  price: data.tick.quote 
                }]
                return newData.slice(-100)
              })
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
  }, [selectedPair, isPaused])

  const handleReset = () => {
    setTickData([])
  }

  const chartData = {
    labels: tickData.map(tick => tick.time.toLocaleTimeString()),
    datasets: [
      {
        label: `${TRADING_PAIRS.find(p => p.value === selectedPair)?.label} Price`,
        data: tickData.map(tick => tick.price),
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
  const priceChange = latestTick && previousTick ? latestTick.price - previousTick.price : 0
  const priceDirection = priceChange >= 0 ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-2">
              <CardTitle className="text-2xl font-bold">Live Trading Chart</CardTitle>
              <CardDescription>Real-time price updates</CardDescription>
            </div>
            {isConnected && (
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
                    <TabsTrigger value="statistics">Statistics</TabsTrigger>
                  </TabsList>
                  <TabsContent value="overview">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Latest Tick Data</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">Time: {latestTick?.time.toLocaleString()}</p>
                        <p className="text-2xl font-bold">{latestTick?.price.toFixed(5)}</p>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  <TabsContent value="statistics">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Trading Statistics</CardTitle>
                      </CardHeader>
                      <CardContent className="grid gap-2">
                        <p className="text-sm text-muted-foreground">Total Ticks: {tickData.length}</p>
                        {tickData.length > 0 && (
                          <>
                            <p className="text-sm text-muted-foreground">
                              Highest: {Math.max(...tickData.map(t => t.price)).toFixed(5)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Lowest: {Math.min(...tickData.map(t => t.price)).toFixed(5)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Average: {(tickData.reduce((acc, t) => acc + t.price, 0) / tickData.length).toFixed(5)}
                            </p>
                          </>
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
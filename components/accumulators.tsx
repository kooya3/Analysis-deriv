'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, TrendingUp, Clock, DollarSign, ArrowUp, ArrowDown, RefreshCw } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TradeExplanationDialog } from './trade-explanation-dialog'
import { useTradeHistory } from '../components/contexts/TradeHistoryContext'
import { toast } from '@/components/ui/use-toast'
import { getSyntheticStats } from './deriv-api'

const VOLATILITY_INDICES = [
  { value: 'V10_1S', label: 'Volatility 10 (1s) Index' },
  { value: 'V25_1S', label: 'Volatility 25 (1s) Index' },
  { value: 'V50_1S', label: 'Volatility 50 (1s) Index' },
  { value: 'V75_1S', label: 'Volatility 75 (1s) Index' },
  { value: 'V100_1S', label: 'Volatility 100 (1s) Index' },
]

const GROWTH_RATES = [
  { value: 1, label: '1%' },
  { value: 2, label: '2%' },
  { value: 3, label: '3%' },
  { value: 4, label: '4%' },
  { value: 5, label: '5%' },
]

const PRICE_RANGE_PERCENTAGE = 0.01216 // ±0.01216% range for valid ticks
const MAX_TICKS = 45
const MAX_PAYOUT = 6000
const INITIAL_SPOT_PRICE = 2113.199 // Based on the CSV data

interface AccumulatorState {
  initialStake: number
  currentStake: number
  profit: number
  takeProfitAmount: number | null
  isActive: boolean
  currentSpotPrice: number
  previousSpotPrice: number
  selectedMarket: string
  tradeStartTime: Date | null
  tickCount: number
  growthRate: number
  consecutiveTickCounts: number[]
  currentConsecutiveTicks: number
}

interface SyntheticStats {
  symbol: string
  last: number
  high: number
  low: number
  average: number
}

export function Accumulators() {
  const { addTradeToHistory } = useTradeHistory()
  const [state, setState] = useState<AccumulatorState>({
    initialStake: 100,
    currentStake: 100,
    profit: 0,
    takeProfitAmount: null,
    isActive: false,
    currentSpotPrice: INITIAL_SPOT_PRICE,
    previousSpotPrice: INITIAL_SPOT_PRICE,
    selectedMarket: 'V25_1S',
    tradeStartTime: null,
    tickCount: 0,
    growthRate: 5,
    consecutiveTickCounts: [],
    currentConsecutiveTicks: 0
  })

  const [isTakeProfitEnabled, setIsTakeProfitEnabled] = useState(false)
  const [stats, setStats] = useState<SyntheticStats | null>(null)
  const [isLoadingStats, setIsLoadingStats] = useState(false)

  const simulatePriceChange = useCallback(() => {
    const volatilityFactor = 0.05
    const randomFactor = (Math.random() - 0.5) * 2
    return state.previousSpotPrice * volatilityFactor * randomFactor
  }, [state.previousSpotPrice])

  useEffect(() => {
    if (state.isActive) {
      const interval = setInterval(() => {
        const priceChange = simulatePriceChange()
        const newSpotPrice = state.previousSpotPrice + priceChange
        
        if (isWithinRange(newSpotPrice, state.previousSpotPrice)) {
          const newTickCount = state.tickCount + 1
          const newStake = state.initialStake * (1 + state.growthRate / 100) * newTickCount
          const newProfit = newStake - state.initialStake
          const newConsecutiveTicks = state.currentConsecutiveTicks + 1
          
          if (newTickCount >= MAX_TICKS || newProfit >= MAX_PAYOUT) {
            closeTrade('won')
            return
          }

          setState(prevState => ({
            ...prevState,
            currentStake: newStake,
            profit: newProfit,
            currentSpotPrice: newSpotPrice,
            previousSpotPrice: prevState.currentSpotPrice,
            tickCount: newTickCount,
            currentConsecutiveTicks: newConsecutiveTicks
          }))

          if (isTakeProfitEnabled && state.takeProfitAmount && newProfit >= state.takeProfitAmount) {
            closeTrade('won')
          }
        } else {
          setState(prevState => ({
            ...prevState,
            consecutiveTickCounts: [...prevState.consecutiveTickCounts, prevState.currentConsecutiveTicks],
            currentConsecutiveTicks: 0,
            currentSpotPrice: newSpotPrice,
            previousSpotPrice: prevState.currentSpotPrice
          }))
        }
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [state, isTakeProfitEnabled, simulatePriceChange])

  const isWithinRange = (current: number, previous: number) => {
    const range = previous * (PRICE_RANGE_PERCENTAGE / 100)
    return Math.abs(current - previous) <= range
  }

  const startTrade = () => {
    setState(prevState => ({ 
      ...prevState, 
      isActive: true,
      tradeStartTime: new Date(),
      tickCount: 0,
      currentSpotPrice: INITIAL_SPOT_PRICE,
      previousSpotPrice: INITIAL_SPOT_PRICE,
      consecutiveTickCounts: [],
      currentConsecutiveTicks: 0,
      profit: 0,
      currentStake: prevState.initialStake
    }))
  }

  const closeTrade = (outcome: 'won' | 'lost') => {
    const tradeEndTime = new Date()

    addTradeToHistory({
      id: Date.now().toString(),
      market: state.selectedMarket,
      startTime: state.tradeStartTime || new Date(),
      endTime: tradeEndTime,
      initialStake: state.initialStake,
      finalStake: state.currentStake,
      profit: state.profit,
      growthRate: state.growthRate,
      takeProfitAmount: state.takeProfitAmount,
      outcome,
      tickCount: state.tickCount,
      consecutiveTickCounts: [...state.consecutiveTickCounts, state.currentConsecutiveTicks]
    })

    setState(prevState => ({
      ...prevState,
      isActive: false,
      currentStake: prevState.initialStake,
      profit: 0,
      currentSpotPrice: INITIAL_SPOT_PRICE,
      previousSpotPrice: INITIAL_SPOT_PRICE,
      tradeStartTime: null,
      tickCount: 0,
      consecutiveTickCounts: [],
      currentConsecutiveTicks: 0
    }))

    toast({
      title: outcome === 'won' ? "Trade Won" : "Trade Lost",
      description: `Trade ended after ${state.tickCount} ticks. Profit: $${state.profit.toFixed(2)}`,
      variant: outcome === 'won' ? "default" : "destructive",
    })
  }

  const fetchSyntheticStats = useCallback(async () => {
    setIsLoadingStats(true)
    try {
      const fetchedStats = await getSyntheticStats(state.selectedMarket.replace('_1S', ''))
      setStats(fetchedStats)
    } catch (error) {
      console.error('Error fetching synthetic stats:', error)
      toast({
        title: "Error",
        description: "Failed to fetch market statistics. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingStats(false)
    }
  }, [state.selectedMarket])

  useEffect(() => {
    fetchSyntheticStats()
  }, [state.selectedMarket, fetchSyntheticStats])

  return (
    <Card className="mb-6 bg-[#0E0E0E] border-zinc-800">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-2xl font-bold text-white">Accumulators</CardTitle>
          <CardDescription className="text-zinc-400">
            Grow your stake by {state.growthRate}% for every tick within ±{PRICE_RANGE_PERCENTAGE}% range
          </CardDescription>
        </div>
        <TradeExplanationDialog />
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="trade" className="text-white">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="trade">Trade</TabsTrigger>
            <TabsTrigger value="stats">Stats</TabsTrigger>
          </TabsList>
          <TabsContent value="trade">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <Select
                  value={state.selectedMarket}
                  onValueChange={(value) => setState(prev => ({ ...prev, selectedMarket: value }))}
                  disabled={state.isActive}
                >
                  <SelectTrigger className="w-[240px] bg-zinc-900 border-zinc-700">
                    <SelectValue placeholder="Select market" />
                  </SelectTrigger>
                  <SelectContent>
                    {VOLATILITY_INDICES.map((market) => (
                      <SelectItem key={market.value} value={market.value}>
                        {market.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2 text-zinc-400">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">
                    Ticks: {state.tickCount}
                    {state.isActive && (
                      <span className="ml-2 text-emerald-500">
                        (${state.profit.toFixed(2)})
                      </span>
                    )}
                  </span>
                </div>
                <div className="text-2xl font-bold">{state.currentSpotPrice.toFixed(3)}</div>
              </div>

              <div className="grid gap-6">
                <div>
                  <Label className="text-zinc-400">Growth rate</Label>
                  <RadioGroup
                    value={state.growthRate.toString()}
                    onValueChange={(value) => setState(prev => ({ ...prev, growthRate: parseInt(value) }))}
                    className="flex justify-between mt-2"
                    disabled={state.isActive}
                  >
                    {GROWTH_RATES.map((rate) => (
                      <div key={rate.value} className="flex items-center">
                        <RadioGroupItem
                          value={rate.value.toString()}
                          id={`rate-${rate.value}`}
                          className="border-emerald-500 text-emerald-500 data-[state=checked]:border-emerald-500 data-[state=checked]:bg-emerald-500"
                        />
                        <Label
                          htmlFor={`rate-${rate.value}`}
                          className={`ml-2 ${state.growthRate === rate.value ? 'text-emerald-500 font-medium' : 'text-zinc-400'}`}
                        >
                          {rate.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="initialStake" className="text-zinc-400">Stake</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                    <Input
                      id="initialStake"
                      type="number"
                      value={state.initialStake}
                      onChange={(e) => setState(prev => ({ ...prev, initialStake: parseFloat(e.target.value), currentStake: parseFloat(e.target.value) }))}
                      className="pl-9 bg-zinc-900 border-zinc-700"
                      disabled={state.isActive}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="take-profit"
                    checked={isTakeProfitEnabled}
                    onCheckedChange={setIsTakeProfitEnabled}
                    disabled={state.isActive}
                    className="data-[state=checked]:bg-emerald-500"
                  />
                  <Label htmlFor="take-profit" className="text-zinc-400">Take Profit</Label>
                </div>

                {isTakeProfitEnabled && (
                  <div className="grid gap-2">
                    <Label htmlFor="takeProfitAmount" className="text-zinc-400">Take Profit Amount</Label>
                    <Input
                      id="takeProfitAmount"
                      type="number"
                      value={state.takeProfitAmount || ''}
                      onChange={(e) => setState(prev => ({ ...prev, takeProfitAmount: parseFloat(e.target.value) }))}
                      className="bg-zinc-900 border-zinc-700"
                      disabled={state.isActive}
                    />
                  </div>
                )}

                <div className="flex justify-between text-sm text-zinc-400">
                  <div>Max. payout</div>
                  <div>${MAX_PAYOUT.toLocaleString()}</div>
                </div>

                <div className="flex justify-between text-sm text-zinc-400">
                  <div>Max. ticks</div>
                  <div>{MAX_TICKS} ticks</div>
                </div>

                <Button 
                  onClick={startTrade} 
                  disabled={state.isActive}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
                  size="lg"
                >
                  Buy
                </Button>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="stats">
            {stats ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Market Statistics</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-zinc-900 p-4 rounded-lg">
                    <p className="text-zinc-400">Last Price</p>
                    <p className="text-2xl font-bold text-white">{stats.last.toFixed(3)}</p>
                  </div>
                  <div className="bg-zinc-900 p-4 rounded-lg">
                    <p className="text-zinc-400">24h High</p>
                    <p className="text-2xl font-bold text-green-500">{stats.high.toFixed(3)}</p>
                  </div>
                  <div className="bg-zinc-900 p-4 rounded-lg">
                    <p className="text-zinc-400">24h Low</p>
                    <p className="text-2xl font-bold text-red-500">{stats.low.toFixed(3)}</p>
                  </div>
                  <div className="bg-zinc-900 p-4 rounded-lg">
                    <p className="text-zinc-400">24h Average</p>
                    <p className="text-2xl font-bold text-white">{stats.average.toFixed(3)}</p>
                  </div>
                </div>
                <Button 
                  onClick={fetchSyntheticStats} 
                  variant="outline" 
                  size="sm"
                  className="mt-4 border-zinc-700 text-zinc-400 hover:bg-zinc-800"
                  disabled={isLoadingStats}
                >
                  {isLoadingStats ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Refreshing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Refresh Stats
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-center h-40 text-zinc-400">
                {isLoadingStats ? 'Loading stats...' : 'No stats available'}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {state.isActive && (
          <Alert className="mt-6 bg-zinc-900 border-zinc-700">
            <TrendingUp className="h-4 w-4" />
            <AlertTitle className="text-white">Trade Active</AlertTitle>
            <AlertDescription className="space-y-2 text-zinc-400">
              <p>Market: {VOLATILITY_INDICES.find(m => m.value === state.selectedMarket)?.label}</p>
              <p>Current Stake: ${state.currentStake.toFixed(2)}</p>
              <p>Profit: ${state.profit.toFixed(2)}</p>
              <p>Ticks: {state.tickCount}</p>
              <p>Current Spot Price: ${state.currentSpotPrice.toFixed(3)}</p>
              <p>Consecutive Ticks: {state.currentConsecutiveTicks}</p>
              <p>Tick History: {state.consecutiveTickCounts.join(', ')}</p>
              <Button 
                onClick={() => closeTrade('won')} 
                variant="outline" 
                size="sm"
                className="mt-2 border-zinc-700 text-zinc-400 hover:bg-zinc-800"
              >
                Close Trade
              </Button>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}

export default Accumulators
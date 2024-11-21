'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, TrendingUp, Clock, DollarSign, Loader2 } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TradeExplanationDialog } from './trade-explanation-dialog'
import { useTradeHistory } from '@/components/contexts/TradeHistoryContext'
import { useAccountBalance } from '@/components/contexts/AccountBalanceContext'
import { toast } from '@/components/ui/use-toast'
import { createPriceSimulator, PriceSimulator } from './price-simulator'

const VOLATILITY_INDICES = [
  { value: 'V10_1S', label: 'Volatility 10 (1s) Index' },
  { value: 'V25_1S', label: 'Volatility 25 (1s) Index' },
  { value: 'V50_1S', label: 'Volatility 50 (1s) Index' },
  { value: 'V75_1S', label: 'Volatility 75 (1s) Index' },
  { value: 'V100_1S', label: 'Volatility 100 (1s) Index' },
]

const GROWTH_RATES = [
  { value: 1, label: '1%', margin: 0.00608 },
  { value: 2, label: '2%', margin: 0.00812 },
  { value: 3, label: '3%', margin: 0.01014 },
  { value: 4, label: '4%', margin: 0.01216 },
  { value: 5, label: '5%', margin: 0.01418 },
]

const MAX_TICKS = 45
const MAX_PAYOUT = 6000
const INITIAL_SPOT_PRICE = 2290.831

interface TradeState {
  isActive: boolean
  currentProfit: number
  tickCount: number
  lastPrice: number
  consecutiveTicks: number
  tickHistory: number[]
  startTime: Date | null
}


export function Accumulators() {
  const { balance, updateBalance } = useAccountBalance()
  const { addTradeToHistory } = useTradeHistory()
  const [selectedMarket, setSelectedMarket] = useState('V25_1S')
  const [stake, setStake] = useState(100)
  const [growthRate, setGrowthRate] = useState(GROWTH_RATES[4])
  const [isTakeProfitEnabled, setIsTakeProfitEnabled] = useState(false)
  const [takeProfitAmount, setTakeProfitAmount] = useState<number | null>(null)
  
  const [tradeState, setTradeState] = useState<TradeState>({
    isActive: false,
    currentProfit: 0,
    tickCount: 0,
    lastPrice: INITIAL_SPOT_PRICE,
    consecutiveTicks: 0,
    tickHistory: [],
    startTime: null
  })

  const priceSimulatorRef = useRef<PriceSimulator | null>(null)

  const startAccumulator = useCallback(() => {
    if (balance < stake) {
      toast({
        title: 'Insufficient Balance',
        description: 'Your account balance is too low to place this trade.',
        variant: 'destructive',
      })
      return
    }

    updateBalance(-stake)
    priceSimulatorRef.current = createPriceSimulator(INITIAL_SPOT_PRICE, 0.01, 0.001)
    setTradeState(prev => ({
      ...prev,
      isActive: true,
      currentProfit: 0,
      tickCount: 0,
      lastPrice: INITIAL_SPOT_PRICE,
      consecutiveTicks: 0,
      tickHistory: [],
      startTime: new Date()
    }))
  }, [balance, stake, updateBalance])

  const stopAccumulator = useCallback((outcome: 'won' | 'lost' = 'won') => {
    const endTime = new Date()
    
    if (tradeState.startTime) {
      const finalProfit = outcome === 'won' ? tradeState.currentProfit : -stake
      updateBalance(stake + finalProfit)

      addTradeToHistory({
        id: Date.now().toString(),
        market: selectedMarket,
        startTime: tradeState.startTime,
        endTime: endTime,
        initialStake: stake,
        finalStake: stake + finalProfit,
        profit: finalProfit,
        growthRate: growthRate.value,
        takeProfitAmount: takeProfitAmount,
        outcome,
        tickCount: tradeState.tickCount,
        consecutiveTickCounts: [...tradeState.tickHistory, tradeState.consecutiveTicks]
      })

      toast({
        title: outcome === 'won' ? 'Trade Won' : 'Trade Lost',
        description: `Trade ended with ${tradeState.tickCount} ticks. Profit: $${finalProfit.toFixed(2)}`,
        variant: outcome === 'won' ? 'default' : 'destructive',
      })
    }

    setTradeState(prev => ({
      ...prev,
      isActive: false,
      startTime: null
    }))
    priceSimulatorRef.current = null
  }, [tradeState, selectedMarket, stake, growthRate.value, takeProfitAmount, addTradeToHistory, updateBalance])

  useEffect(() => {
    let intervalId: NodeJS.Timeout

    if (tradeState.isActive && priceSimulatorRef.current) {
      intervalId = setInterval(() => {
        const newPrice = priceSimulatorRef.current!.nextPrice()
        const priceChange = Math.abs((newPrice - tradeState.lastPrice) / tradeState.lastPrice)
        
        setTradeState(prev => {
          if (priceChange <= growthRate.margin) {
            const newTickCount = prev.tickCount + 1
            const newProfit = stake * Math.pow(1 + growthRate.value / 100, newTickCount) - stake
            const newConsecutiveTicks = prev.consecutiveTicks + 1
            
            if (newTickCount >= MAX_TICKS || newProfit >= MAX_PAYOUT) {
              stopAccumulator('won')
              return prev
            }

            if (isTakeProfitEnabled && takeProfitAmount && newProfit >= takeProfitAmount) {
              stopAccumulator('won')
              return prev
            }

            return {
              ...prev,
              tickCount: newTickCount,
              currentProfit: newProfit,
              lastPrice: newPrice,
              consecutiveTicks: newConsecutiveTicks
            }
          }
          
          stopAccumulator('lost')
          return {
            ...prev,
            tickHistory: [...prev.tickHistory, prev.consecutiveTicks],
            consecutiveTicks: 0,
            lastPrice: newPrice
          }
        })
      }, 1000)
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [tradeState.isActive, tradeState.lastPrice, stake, growthRate, isTakeProfitEnabled, takeProfitAmount, stopAccumulator])

  return (
    <Card className="mb-6 bg-[#0E0E0E] border-zinc-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold text-white">Accumulators</CardTitle>
            <CardDescription className="text-white/80">
              Grow your stake by {growthRate.value}% for every tick within ±{(growthRate.margin * 100).toFixed(5)}% range
            </CardDescription>
          </div>
          <TradeExplanationDialog />
        </div>
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
                  value={selectedMarket}
                  onValueChange={setSelectedMarket}
                  disabled={tradeState.isActive}
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
                    Ticks: {tradeState.tickCount}
                    {tradeState.isActive && (
                      <span className="ml-2 text-emerald-500">
                        (${tradeState.currentProfit.toFixed(2)})
                      </span>
                    )}
                  </span>
                </div>
                <div className="text-2xl font-bold">{tradeState.lastPrice.toFixed(3)}</div>
              </div>

              <div className="grid gap-6">
                <div>
                  <Label className="text-zinc-400">Growth rate</Label>
                  <RadioGroup
                    value={growthRate.value.toString()}
                    onValueChange={(value) => setGrowthRate(GROWTH_RATES[Number(value) - 1])}
                    className="flex justify-between mt-2"
                    disabled={tradeState.isActive}
                  >
                    {GROWTH_RATES.map((rate) => (
                      <div key={rate.value} className="flex items-center">
                        <RadioGroupItem
                          value={rate.value.toString()}
                          id={`rate-${rate.value}`}
                          className="border-emerald-500 text-emerald-500"
                        />
                        <Label
                          htmlFor={`rate-${rate.value}`}
                          className={`ml-2 ${growthRate.value === rate.value ? 'text-emerald-500 font-medium' : 'text-zinc-400'}`}
                        >
                          {rate.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="stake" className="text-zinc-400">Stake</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                    <Input
                      id="stake"
                      type="number"
                      value={stake}
                      onChange={(e) => setStake(Number(e.target.value))}
                      className="pl-9 bg-zinc-900 border-zinc-700"
                      disabled={tradeState.isActive}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="take-profit"
                    checked={isTakeProfitEnabled}
                    onCheckedChange={setIsTakeProfitEnabled}
                    disabled={tradeState.isActive}
                  />
                  <Label htmlFor="take-profit" className="text-zinc-400">Take Profit</Label>
                </div>

                {isTakeProfitEnabled && (
                  <div className="grid gap-2">
                    <Label htmlFor="takeProfitAmount" className="text-zinc-400">Take Profit Amount</Label>
                    <Input
                      id="takeProfitAmount"
                      type="number"
                      value={takeProfitAmount || ''}
                      onChange={(e) => setTakeProfitAmount(Number(e.target.value))}
                      className="bg-zinc-900 border-zinc-700"
                      disabled={tradeState.isActive}
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
                  onClick={tradeState.isActive ? () => stopAccumulator('lost') : startAccumulator}
                  className={`w-full ${
                    tradeState.isActive 
                      ? 'bg-red-500 hover:bg-red-600' 
                      : 'bg-emerald-500 hover:bg-emerald-600'
                  } text-white`}
                  size="lg"
                >
                  {tradeState.isActive ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Stop Trade
                    </>
                  ) : (
                    'Start Trade'
                  )}
                </Button>
              </div>

              {tradeState.isActive && (
                <div className="grid grid-cols-2 gap-4 p-4 bg-zinc-900/50 rounded-lg animate-in fade-in slide-in-from-bottom-4">
                  <div className="space-y-1">
                    <p className="text-sm text-white/80">Current Profit</p>
                    <p className="text-2xl font-mono text-emerald-500">
                      ${tradeState.currentProfit.toFixed(2)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-white/80">Tick Count</p>
                    <p className="text-2xl font-mono text-emerald-500">
                      {tradeState.tickCount}
                    </p>
                  </div>
                </div>
              )}

              {tradeState.isActive && (
                <Alert className="mt-6 bg-zinc-900 border-zinc-700">
                  <TrendingUp className="h-4 w-4" />
                  <AlertTitle className="text-white">Trade Active</AlertTitle>
                  <AlertDescription className="space-y-2 text-zinc-400">
                    <p>Market: {VOLATILITY_INDICES.find(m => m.value === selectedMarket)?.label}</p>
                    <p>Current Stake: ${stake.toFixed(2)}</p>
                    <p>Profit: ${tradeState.currentProfit.toFixed(2)}</p>
                    <p>Ticks: {tradeState.tickCount}</p>
                    <p>Current Spot Price: ${tradeState.lastPrice.toFixed(3)}</p>
                    <p>Consecutive Ticks: {tradeState.consecutiveTicks}</p>
                    <p>Tick History: {tradeState.tickHistory.join(', ')}</p>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </TabsContent>
          <TabsContent value="stats">
            <div className="p-4 text-white/80">
              Trading statistics will appear here
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

export default Accumulators
"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, TrendingUp, ArrowUp, ArrowDown, Clock, DollarSign } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TradeExplanationDialog } from './trade-explanation-dialog'
import { useTradeHistory } from './contexts/TradeHistoryContext'
import { toast } from '@/components/ui/use-toast'

const VOLATILITY_INDICES = [
  { value: 'V10_1S', label: 'Volatility 10 (1s) Index' },
  { value: 'V25_1S', label: 'Volatility 25 (1s) Index' },
  { value: 'V50_1S', label: 'Volatility 50 (1s) Index' },
  { value: 'V75_1S', label: 'Volatility 75 (1s) Index' },
  { value: 'V100_1S', label: 'Volatility 100 (1s) Index' },
  { value: 'V150_1S', label: 'Volatility 150 (1s) Index' },
  { value: 'V250_1S', label: 'Volatility 250 (1s) Index' },
  { value: 'BOOM300', label: 'Boom 300 Index' },
  { value: 'BOOM500', label: 'Boom 500 Index' },
  { value: 'BOOM1000', label: 'Boom 1000 Index' },
]

const GROWTH_RATES = [1, 2, 3, 4, 5]

interface AccumulatorState {
  initialStake: number
  currentStake: number
  profit: number
  growthRate: number
  takeProfitAmount: number | null
  isActive: boolean
  currentSpotPrice: number
  previousSpotPrice: number
  selectedMarket: string
  tradeStartTime: Date | null
}

export function Accumulators() {
  const { addTradeToHistory } = useTradeHistory()
  const [state, setState] = useState<AccumulatorState>({
    initialStake: 100,
    currentStake: 100,
    profit: 0,
    growthRate: 1,
    takeProfitAmount: null,
    isActive: false,
    currentSpotPrice: 1000,
    previousSpotPrice: 1000,
    selectedMarket: 'V25_1S',
    tradeStartTime: null
  })

  const [isTakeProfitEnabled, setIsTakeProfitEnabled] = useState(false)

  useEffect(() => {
    if (state.isActive) {
      const interval = setInterval(() => {
        const volatilityFactor = parseInt(state.selectedMarket.match(/\d+/)?.[0] || '25') / 1000
        const newSpotPrice = state.currentSpotPrice + (Math.random() - 0.5) * volatilityFactor * state.currentSpotPrice
        
        if (isWithinRange(newSpotPrice, state.previousSpotPrice)) {
          const newStake = state.currentStake * (1 + state.growthRate / 100)
          const newProfit = newStake - state.initialStake
          
          setState(prevState => ({
            ...prevState,
            currentStake: newStake,
            profit: newProfit,
            currentSpotPrice: newSpotPrice,
            previousSpotPrice: prevState.currentSpotPrice
          }))

          if (isTakeProfitEnabled && state.takeProfitAmount && newProfit >= state.takeProfitAmount) {
            closeTrade('won')
          }
        } else {
          closeTrade('lost')
        }
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [state, isTakeProfitEnabled])

  const isWithinRange = (current: number, previous: number) => {
    const range = previous * 0.01 // 1% range
    return Math.abs(current - previous) <= range
  }

  const startTrade = () => {
    setState(prevState => ({ 
      ...prevState, 
      isActive: true,
      tradeStartTime: new Date()
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
      outcome
    })

    setState(prevState => ({
      ...prevState,
      isActive: false,
      currentStake: prevState.initialStake,
      profit: 0,
      currentSpotPrice: 1000,
      previousSpotPrice: 1000,
      tradeStartTime: null
    }))

    toast({
      title: outcome === 'won' ? "Trade Won" : "Trade Lost",
      description: `Your trade has ended. Profit: $${state.profit.toFixed(2)}`,
      variant: outcome === 'won' ? "default" : "destructive",
    })
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold">Accumulators</CardTitle>
            <CardDescription>Grow your stake exponentially based on index movement</CardDescription>
          </div>
          <TradeExplanationDialog />
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="trade">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="trade">Trade</TabsTrigger>
              <TabsTrigger value="chart">Chart</TabsTrigger>
            </TabsList>
            <TabsContent value="trade">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <Select
                    value={state.selectedMarket}
                    onValueChange={(value) => setState(prev => ({ ...prev, selectedMarket: value }))}
                    disabled={state.isActive}
                  >
                    <SelectTrigger className="w-[240px]">
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
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">Real-time</span>
                  </div>
                  <div className="text-2xl font-bold">{state.currentSpotPrice.toFixed(2)}</div>
                </div>

                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="initialStake">Initial Stake</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="initialStake"
                        type="number"
                        value={state.initialStake}
                        onChange={(e) => setState(prev => ({ ...prev, initialStake: parseFloat(e.target.value), currentStake: parseFloat(e.target.value) }))}
                        className="pl-9"
                        disabled={state.isActive}
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label>Growth Rate</Label>
                    <RadioGroup
                      value={state.growthRate.toString()}
                      onValueChange={(value) => setState(prev => ({ ...prev, growthRate: parseInt(value) }))}
                      className="flex space-x-4"
                      disabled={state.isActive}
                    >
                      {GROWTH_RATES.map((rate) => (
                        <div key={rate} className="flex items-center space-x-2">
                          <RadioGroupItem value={rate.toString()} id={`rate-${rate}`} />
                          <Label htmlFor={`rate-${rate}`}>{rate}%</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="take-profit"
                      checked={isTakeProfitEnabled}
                      onCheckedChange={setIsTakeProfitEnabled}
                      disabled={state.isActive}
                    />
                    <Label htmlFor="take-profit">Enable Take Profit</Label>
                  </div>

                  {isTakeProfitEnabled && (
                    <div className="grid gap-2">
                      <Label htmlFor="takeProfitAmount">Take Profit Amount</Label>
                      <Input
                        id="takeProfitAmount"
                        type="number"
                        value={state.takeProfitAmount || ''}
                        onChange={(e) => setState(prev => ({ ...prev, takeProfitAmount: parseFloat(e.target.value) }))}
                        disabled={state.isActive}
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-muted">
                      <div className="text-sm text-muted-foreground mb-1">Current Stake</div>
                      <div className="text-2xl font-bold">${state.currentStake.toFixed(2)}</div>
                    </div>
                    <div className="p-4 rounded-lg bg-muted">
                      <div className="text-sm text-muted-foreground mb-1">Profit</div>
                      <div className="text-2xl font-bold text-green-500">${state.profit.toFixed(2)}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Button 
                      onClick={startTrade} 
                      disabled={state.isActive}
                      className="bg-green-500 hover:bg-green-600"
                    >
                      <ArrowUp className="w-4 h-4 mr-2" />
                      Rise
                    </Button>
                    <Button 
                      onClick={startTrade} 
                      variant="destructive" 
                      disabled={state.isActive}
                    >
                      <ArrowDown className="w-4 h-4 mr-2" />
                      Fall
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="chart">
              <div className="h-[400px] flex items-center justify-center bg-muted rounded-lg">
                Chart visualization will be implemented here
              </div>
            </TabsContent>
          </Tabs>

          {state.isActive && (
            <Alert className="mt-6">
              <TrendingUp className="h-4 w-4" />
              <AlertTitle>Trade Active</AlertTitle>
              <AlertDescription className="space-y-2">
                <p>Market: {VOLATILITY_INDICES.find(m => m.value === state.selectedMarket)?.label}</p>
                <p>Current Stake: ${state.currentStake.toFixed(2)}</p>
                <p>Profit: ${state.profit.toFixed(2)}</p>
                <p>Current Spot Price: ${state.currentSpotPrice.toFixed(2)}</p>
                <Button 
                  onClick={() => closeTrade('lost')} 
                  variant="outline" 
                  size="sm"
                  className="mt-2"
                >
                  Close Trade
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Alert variant="warning">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Risk Warning</AlertTitle>
        <AlertDescription>
          Your stake will continue to grow as long as the current spot price remains within a specified range from the previous spot price. Otherwise, you lose your stake and the trade is terminated.
        </AlertDescription>
      </Alert>
    </div>
  )
}
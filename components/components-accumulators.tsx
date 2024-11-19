'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Clock, DollarSign } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TradeExplanationDialog } from './trade-explanation-dialog'

// Constants for calculations
const PRICE_RANGE_PERCENTAGE = 0.01216
const MAX_TICKS = 45
const MAX_PAYOUT = 6000
const INITIAL_SPOT_PRICE = 2113.199

const VOLATILITY_INDICES = [
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

interface AccumulatorState {
  initialStake: number
  currentStake: number
  profit: number
  tickCount: number
  growthRate: number
  isActive: boolean
  selectedMarket: string
}

export function Accumulators() {
  const [state, setState] = useState<AccumulatorState>({
    initialStake: 100,
    currentStake: 100,
    profit: 0,
    tickCount: 0,
    growthRate: 5,
    isActive: false,
    selectedMarket: 'V25_1S'
  })

  const [isTakeProfitEnabled, setIsTakeProfitEnabled] = useState(false)

  // Calculate profit based on tick count and growth rate
  const calculateProfit = useCallback((ticks: number, initialStake: number, growthRate: number) => {
    let currentStake = initialStake
    for (let i = 0; i < ticks; i++) {
      currentStake *= (1 + growthRate / 100)
    }
    return currentStake - initialStake
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout
    
    if (state.isActive) {
      interval = setInterval(() => {
        setState(prev => {
          const newTickCount = prev.tickCount + 1
          const newProfit = calculateProfit(newTickCount, prev.initialStake, prev.growthRate)
          
          // Check if we've hit max ticks or max payout
          if (newTickCount >= MAX_TICKS || newProfit >= MAX_PAYOUT) {
            clearInterval(interval)
            return { ...prev, isActive: false }
          }
          
          return {
            ...prev,
            tickCount: newTickCount,
            profit: newProfit,
            currentStake: prev.initialStake + newProfit
          }
        })
      }, 1000) // Update every second
    }

    return () => clearInterval(interval)
  }, [state.isActive, calculateProfit])

  const startTrade = () => {
    setState(prev => ({
      ...prev,
      isActive: true,
      tickCount: 0,
      profit: 0,
      currentStake: prev.initialStake
    }))
  }

  return (
    <Card className="bg-[#0E0E0E] border-zinc-800">
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
                  <span className="text-sm font-medium">
                    Ticks: {state.tickCount}
                    {state.isActive && (
                      <span className="ml-2 text-emerald-500">
                        (${state.profit.toFixed(2)})
                      </span>
                    )}
                  </span>
                </div>
                <div className="text-2xl font-bold">{INITIAL_SPOT_PRICE.toFixed(3)}</div>
              </div>

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
                        className="border-zinc-600"
                      />
                      <Label 
                        htmlFor={`rate-${rate.value}`}
                        className={`ml-2 ${state.growthRate === rate.value ? 'text-white' : 'text-zinc-400'}`}
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
                    value={state.initialStake}
                    onChange={(e) => setState(prev => ({ 
                      ...prev, 
                      initialStake: parseFloat(e.target.value),
                      currentStake: parseFloat(e.target.value)
                    }))}
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
          </TabsContent>
          <TabsContent value="stats">
            <div className="h-[400px] flex items-center justify-center text-zinc-400">
              Coming soon...
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

export default Accumulators
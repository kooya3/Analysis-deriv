'use client'

import { useState, useEffect } from 'react'
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
import { toast } from '@/components/ui/use-toast'

// ... (previous constants remain the same)

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

  const startAccumulator = async () => {
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
  }

  const stopAccumulator = (outcome: 'won' | 'lost' = 'won') => {
    const endTime = new Date()
    
    // Add trade to history
    if (tradeState.startTime) {
      addTradeToHistory({
        id: Date.now().toString(),
        market: selectedMarket,
        startTime: tradeState.startTime,
        endTime: endTime,
        initialStake: stake,
        finalStake: stake + tradeState.currentProfit,
        profit: tradeState.currentProfit,
        growthRate: growthRate.value,
        takeProfitAmount: takeProfitAmount,
        outcome,
        tickCount: tradeState.tickCount,
        consecutiveTickCounts: [...tradeState.tickHistory, tradeState.consecutiveTicks]
      })

      // Show toast notification
      toast({
        title: outcome === 'won' ? 'Trade Won' : 'Trade Lost',
        description: `Trade ended with ${tradeState.tickCount} ticks. Profit: $${tradeState.currentProfit.toFixed(2)}`,
        variant: outcome === 'won' ? 'default' : 'destructive',
      })
    }

    setTradeState(prev => ({
      ...prev,
      isActive: false,
      startTime: null
    }))
  }

  useEffect(() => {
    let intervalId: NodeJS.Timeout

    if (tradeState.isActive) {
      intervalId = setInterval(async () => {
        const newPrice = tradeState.lastPrice * (1 + (Math.random() - 0.5) * 0.02)
        const priceChange = Math.abs((newPrice - tradeState.lastPrice) / tradeState.lastPrice)
        
        setTradeState(prev => {
          if (priceChange <= growthRate.margin) {
            const newTickCount = prev.tickCount + 1
            const newProfit = stake * Math.pow(1 + growthRate.value / 100, newTickCount) - stake
            const newConsecutiveTicks = prev.consecutiveTicks + 1
            
            // Check for max ticks or max payout
            if (newTickCount >= MAX_TICKS || newProfit >= MAX_PAYOUT) {
              clearInterval(intervalId)
              stopAccumulator('won')
              return prev
            }

            // Check for take profit
            if (isTakeProfitEnabled && takeProfitAmount && newProfit >= takeProfitAmount) {
              clearInterval(intervalId)
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
          
          // Price moved outside range - trade lost
          clearInterval(intervalId)
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
  }, [tradeState.isActive, tradeState.lastPrice, stake, growthRate, isTakeProfitEnabled, takeProfitAmount])

  // ... (rest of the JSX remains the same)
}

export default Accumulators
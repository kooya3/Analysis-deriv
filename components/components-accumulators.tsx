"use client"

import { useState, useEffect, useContext } from 'react'
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
import { TradeHistoryContext } from '@/contexts/TradeHistoryContext'
import { toast } from '@/components/ui/use-toast'

// ... (keep the VOLATILITY_INDICES and GROWTH_RATES constants)

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
  tradeDirection: 'rise' | 'fall' | null
  entrySpotPrice: number
  tradeStartTime: number
}

export function Accumulators() {
  const { addTradeToHistory } = useContext(TradeHistoryContext)
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
    tradeDirection: null,
    entrySpotPrice: 0,
    tradeStartTime: 0
  })

  const [isTakeProfitEnabled, setIsTakeProfitEnabled] = useState(false)

  useEffect(() => {
    if (state.isActive) {
      const interval = setInterval(() => {
        // Simulate price movement with volatility based on selected market
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

          // Check if trade is about to result in a loss
          if (isTradeAboutToLose(newSpotPrice)) {
            toast({
              title: "Warning",
              description: "Your trade is at risk of losing. Consider closing the position.",
              variant: "destructive",
            })
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

  const isTradeAboutToLose = (currentPrice: number) => {
    const lossThreshold = 0.005 // 0.5% from the entry price
    if (state.tradeDirection === 'rise') {
      return currentPrice < state.entrySpotPrice * (1 + lossThreshold)
    } else if (state.tradeDirection === 'fall') {
      return currentPrice > state.entrySpotPrice * (1 - lossThreshold)
    }
    return false
  }

  const startTrade = (direction: 'rise' | 'fall') => {
    setState(prevState => ({ 
      ...prevState, 
      isActive: true,
      tradeDirection: direction,
      entrySpotPrice: prevState.currentSpotPrice,
      tradeStartTime: Date.now()
    }))
  }

  const closeTrade = (outcome: 'won' | 'lost') => {
    const tradeEndTime = Date.now()
    const tradeDuration = (tradeEndTime - state.tradeStartTime) / 1000 // duration in seconds

    // Log trade to history
    addTradeToHistory({
      market: state.selectedMarket,
      direction: state.tradeDirection!,
      entrySpot: state.entrySpotPrice,
      exitSpot: state.currentSpotPrice,
      stake: state.initialStake,
      payout: state.currentStake,
      profit: state.profit,
      outcome,
      timestamp: new Date().toISOString(),
      duration: tradeDuration
    })

    setState(prevState => ({
      ...prevState,
      isActive: false,
      currentStake: prevState.initialStake,
      profit: 0,
      currentSpotPrice: 1000,
      previousSpotPrice: 1000,
      tradeDirection: null,
      entrySpotPrice: 0,
      tradeStartTime: 0
    }))

    toast({
      title: outcome === 'won' ? "Trade Won" : "Trade Lost",
      description: `Your trade has ended. Profit: $${state.profit.toFixed(2)}`,
      variant: outcome === 'won' ? "default" : "destructive",
    })
  }

  // ... (keep the return statement and UI rendering logic)
}
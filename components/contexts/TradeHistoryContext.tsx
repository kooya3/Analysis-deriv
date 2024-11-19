"use client"

import React, { createContext, useContext, useState, useCallback } from 'react'

interface Trade {
  id: string
  market: string
  startTime: Date
  endTime: Date
  initialStake: number
  finalStake: number
  profit: number
  growthRate: number
  takeProfitAmount: number | null
  outcome: 'won' | 'lost'
}

interface TradeHistoryContextType {
  tradeHistory: Trade[]
  addTradeToHistory: (trade: Trade) => void
  clearTradeHistory: () => void
}

const TradeHistoryContext = createContext<TradeHistoryContextType | null>(null)

export function TradeHistoryProvider({ children }: { children: React.ReactNode }) {
  const [tradeHistory, setTradeHistory] = useState<Trade[]>([])

  const addTradeToHistory = useCallback((trade: Trade) => {
    setTradeHistory(prev => [...prev, trade])
  }, [])

  const clearTradeHistory = useCallback(() => {
    setTradeHistory([])
  }, [])

  return (
    <TradeHistoryContext.Provider 
      value={{ tradeHistory, addTradeToHistory, clearTradeHistory }}
    >
      {children}
    </TradeHistoryContext.Provider>
  )
}

export function useTradeHistory() {
  const context = useContext(TradeHistoryContext)
  if (!context) {
    throw new Error('useTradeHistory must be used within a TradeHistoryProvider')
  }
  return context
}
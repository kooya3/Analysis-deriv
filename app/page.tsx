'use client'

import { TradingErrorBoundary } from "@/components/trading-error-boundary"
import { LiveTradingAnalysis } from "@/components/live-trading-analysis"
import { Accumulators } from "@/components/accumulators"
import { PriceChart } from "@/components/price-chart"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function HomePage() {
  const [selectedSymbol, setSelectedSymbol] = useState("R_50")
  const [selectedInterval, setSelectedInterval] = useState("60")

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-center">Trading Analysis Dashboard</h1>
            <p className="text-muted-foreground text-center">
              Real-time trading analysis and predictions
            </p>
          </div>

          <TradingErrorBoundary>
            <div className="grid gap-8">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-center">
                <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select symbol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="R_10">Volatility 10 Index</SelectItem>
                    <SelectItem value="R_25">Volatility 25 Index</SelectItem>
                    <SelectItem value="R_50">Volatility 50 Index</SelectItem>
                    <SelectItem value="R_75">Volatility 75 Index</SelectItem>
                    <SelectItem value="R_100">Volatility 100 Index</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedInterval} onValueChange={setSelectedInterval}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select interval" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="60">1 minute</SelectItem>
                    <SelectItem value="300">5 minutes</SelectItem>
                    <SelectItem value="900">15 minutes</SelectItem>
                    <SelectItem value="1800">30 minutes</SelectItem>
                    <SelectItem value="3600">1 hour</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <PriceChart symbol={selectedSymbol} interval={selectedInterval} />
              <LiveTradingAnalysis />
              <Accumulators />
              <div className="flex justify-center">
                <Link href="/history">
                  <Button size="lg">
                    View Trade History
                  </Button>
                </Link>
              </div>
            </div>
          </TradingErrorBoundary>
        </div>
      </main>
    </div>
  )
}
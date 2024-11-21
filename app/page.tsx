'use client'

import { useState } from "react"
import Link from "next/link"
import { TradingErrorBoundary } from "@/components/trading-error-boundary"
import { LiveTradingAnalysis } from "@/components/live-trading-analysis"
import { Accumulators } from "@/components/accumulators"
import { AccumulatorSimulation } from "@/components/accumulator-simulation"
import PriceChart from "@/components/price-chart"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PlateEditor } from '@/components/PlateEditor'

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
              <PriceChart symbol={selectedSymbol} interval={selectedInterval} />

              <Accumulators />
              <AccumulatorSimulation />
              
              <div className="bg-card rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-semibold mb-4">Trading Notes</h2>
                <PlateEditor />
              </div>

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
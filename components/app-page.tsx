'use client'

import Link from 'next/link'
import { TradingErrorBoundary } from "@/components/trading-error-boundary"
import { LiveTradingAnalysis } from "@/components/live-trading-analysis"
import { Accumulators } from "@/components/accumulators"
import { Button } from "@/components/ui/button"

export function BlockPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-6 text-center">Trading Analysis Dashboard</h1>
      <TradingErrorBoundary>
        <div className="space-y-8">
          <LiveTradingAnalysis />
          <Accumulators />
          <div className="flex justify-center">
            <Link href="/history">
              <Button>View Trade History</Button>
            </Link>
          </div>
        </div>
      </TradingErrorBoundary>
    </main>
  )
}
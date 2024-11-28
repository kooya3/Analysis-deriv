"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Info, TrendingUp, Timer, DollarSign, AlertTriangle } from 'lucide-react'
import Image from "next/image"

export function TradeExplanationDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Info className="w-4 h-4 mr-2" />
          Explanation
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Understanding Accumulator Trades</DialogTitle>
          <DialogDescription>
            Learn how accumulator trades work and their winning conditions
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <section className="space-y-4">
            <h3 className="text-lg font-semibold">How Accumulators Work</h3>
            
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <TrendingUp className="w-4 h-4 mt-1 text-emerald-500" />
                <p>Your stake grows by a selected percentage (growth rate) for each successful tick where the price stays within the specified range.</p>
              </div>
              
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 mt-1 text-red-500" />
                <p>If the price moves outside the allowed range at any point, the trade ends and you lose your stake.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-muted p-4 rounded-lg">
              <div className="space-y-2">
                <h4 className="font-medium">Successful Trade</h4>
                <div className="bg-white p-4 rounded-lg">
                  <Image
                    src="/placeholder.svg?height=150&width=200"
                    alt="Successful accumulator trade example showing price staying within range"
                    width={200}
                    height={150}
                    className="w-full"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Failed Trade</h4>
                <div className="bg-white p-4 rounded-lg">
                  <Image
                    src="/placeholder.svg?height=150&width=200"
                    alt="Failed accumulator trade example showing price moving outside range"
                    width={200}
                    height={150}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-lg font-semibold">Growth Rates and Margins</h3>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <Timer className="w-4 h-4 mt-1 text-blue-500" />
                <div className="space-y-1">
                  <p>Each growth rate has a corresponding price movement margin:</p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>1% growth: ±0.608% margin</li>
                    <li>2% growth: ±0.812% margin</li>
                    <li>3% growth: ±1.014% margin</li>
                    <li>4% growth: ±1.216% margin</li>
                    <li>5% growth: ±1.418% margin</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-lg font-semibold">Take Profit</h3>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <DollarSign className="w-4 h-4 mt-1 text-emerald-500" />
                <div className="space-y-1">
                  <p>You can set an optional take profit amount to automatically close the trade when your profit reaches the specified level.</p>
                  <p>This helps secure profits in favorable market conditions without having to manually monitor the trade.</p>
                </div>
              </div>
            </div>
          </section>

          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
            <h4 className="font-medium flex items-center gap-2 mb-2">
              <Info className="w-4 h-4" />
              Important Notes
            </h4>
            <ul className="list-disc list-inside text-sm ml-4 space-y-1">
              <li>Maximum payout is limited to $6,000</li>
              <li>Maximum number of ticks is 45</li>
              <li>Higher growth rates offer larger potential returns but are harder to achieve</li>
              <li>The trade will automatically close if you reach either the maximum payout or maximum ticks</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
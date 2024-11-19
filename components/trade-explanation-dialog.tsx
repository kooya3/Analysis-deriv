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
import { Info, ArrowUp, ArrowDown } from 'lucide-react'
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
          <DialogTitle>Understanding Rise/Fall Contracts</DialogTitle>
          <DialogDescription>
            Learn how Rise/Fall contracts work and their winning conditions
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <section className="space-y-4">
            <h3 className="text-lg font-semibold">Winning the contract</h3>
            
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <ArrowUp className="w-4 h-4 mt-1 text-green-500" />
                <p>If you select "Rise", you win the payout if the <span className="font-semibold">exit spot</span> is strictly higher than the <span className="font-semibold">entry spot</span>.</p>
              </div>
              
              <div className="flex items-start gap-2">
                <ArrowDown className="w-4 h-4 mt-1 text-red-500" />
                <p>If you select "Fall", you win the payout if the <span className="font-semibold">exit spot</span> is strictly lower than the <span className="font-semibold">entry spot</span>.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-muted p-4 rounded-lg">
              <div className="space-y-2">
                <h4 className="font-medium">Rise</h4>
                <div className="bg-white p-4 rounded-lg">
                  <Image
                    src="/assets/rises.svg"
                    alt="Rise contract example"
                    width={200}
                    height={150}
                    className="w-full"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Fall</h4>
                <div className="bg-white p-4 rounded-lg">
                  <Image
                    src="/placeholder.svg?height=150&width=200"
                    alt="Fall contract example"
                    width={200}
                    height={150}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-lg font-semibold">Entry spot</h3>
            <div className="space-y-2">
              <p>The <span className="font-semibold">start time</span> is when the contract is processed by our servers and the <span className="font-semibold">entry spot</span> is the next tick thereafter.</p>
              <p>If you select a <span className="font-semibold">start time</span> in the future, the <span className="font-semibold">start time</span> is that which is selected and the <span className="font-semibold">entry spot</span> is the price in effect at that time.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-lg font-semibold">Exit spot</h3>
            <div className="space-y-2">
              <p>The <span className="font-semibold">exit spot</span> is the latest tick at or before the <span className="font-semibold">end time</span>.</p>
              <p>If you select a <span className="font-semibold">start time</span> of "Now", the <span className="font-semibold">end time</span> is the selected number of minutes/hours after the <span className="font-semibold">start time</span> (if less than one day in duration), or at the end of the trading day (if one day or more in duration).</p>
              <p>If you select a specific <span className="font-semibold">end time</span>, the <span className="font-semibold">end time</span> is the selected time.</p>
            </div>
          </section>

          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
            <h4 className="font-medium flex items-center gap-2 mb-2">
              <Info className="w-4 h-4" />
              Note
            </h4>
            <p className="text-sm">Rise/Fall contracts will be refunded if:</p>
            <ul className="list-disc list-inside text-sm ml-4 space-y-1">
              <li>There are less than 2 ticks between the start and end times</li>
              <li>The contract doesn't end within 5 minutes (for tick duration contracts)</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
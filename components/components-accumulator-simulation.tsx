'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface SimulationResult {
  tickCount: number
  profit: number
  winProbability: number
}

const VOLATILITY_INDICES = [
  { value: 'V10_1S', label: 'Volatility 10 (1s) Index' },
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

export function AccumulatorSimulation() {
  const [simulationParams, setSimulationParams] = useState({
    market: 'V25_1S',
    growthRate: 3,
    initialStake: 100,
    simulationCount: 1000,
  })
  const [simulationResults, setSimulationResults] = useState<SimulationResult[]>([])

  const runSimulation = useCallback(() => {
    const results: SimulationResult[] = []
    const maxTicks = 45 // Maximum number of ticks in a trade

    for (let i = 1; i <= maxTicks; i++) {
      let winCount = 0
      let totalProfit = 0

      for (let j = 0; j < simulationParams.simulationCount; j++) {
        const outcome = simulateTrade(i, simulationParams.growthRate, simulationParams.initialStake)
        if (outcome.success) {
          winCount++
          totalProfit += outcome.profit
        }
      }

      results.push({
        tickCount: i,
        profit: totalProfit / simulationParams.simulationCount,
        winProbability: (winCount / simulationParams.simulationCount) * 100
      })
    }

    setSimulationResults(results)
  }, [simulationParams])

  const simulateTrade = (targetTicks: number, growthRate: number, initialStake: number) => {
    let currentStake = initialStake
    const priceChangeRange = 0.01216 // ±0.01216% range for valid ticks

    for (let tick = 1; tick <= targetTicks; tick++) {
      const priceChange = (Math.random() - 0.5) * 2 * priceChangeRange
      if (Math.abs(priceChange) <= priceChangeRange) {
        currentStake *= (1 + growthRate / 100)
      } else {
        return { success: false, profit: 0 }
      }
    }

    return { success: true, profit: currentStake - initialStake }
  }

  return (
    <Card className="mb-6 bg-[#0E0E0E] border-zinc-800">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-white">Accumulator Simulation</CardTitle>
        <CardDescription className="text-white">
          Simulate and analyze Accumulator trades to optimize your strategy
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 mb-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="market" className="text-white">Market</Label>
              <Select
                value={simulationParams.market}
                onValueChange={(value) => setSimulationParams(prev => ({ ...prev, market: value }))}
              >
                <SelectTrigger id="market" className="bg-zinc-900 border-zinc-700 text-white">
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
            </div>
            <div>
              <Label htmlFor="growthRate" className="text-white">Growth Rate</Label>
              <Select
                value={simulationParams.growthRate.toString()}
                onValueChange={(value) => setSimulationParams(prev => ({ ...prev, growthRate: parseInt(value) }))}
              >
                <SelectTrigger id="growthRate" className="bg-zinc-900 border-zinc-700 text-white">
                  <SelectValue placeholder="Select growth rate" />
                </SelectTrigger>
                <SelectContent>
                  {GROWTH_RATES.map((rate) => (
                    <SelectItem key={rate.value} value={rate.value.toString()}>
                      {rate.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="initialStake" className="text-white">Initial Stake</Label>
              <Input
                id="initialStake"
                type="number"
                value={simulationParams.initialStake}
                onChange={(e) => setSimulationParams(prev => ({ ...prev, initialStake: parseFloat(e.target.value) }))}
                className="bg-zinc-900 border-zinc-700 text-emerald-500"
              />
            </div>
            <div>
              <Label htmlFor="simulationCount" className="text-white">Simulation Count</Label>
              <Input
                id="simulationCount"
                type="number"
                value={simulationParams.simulationCount}
                onChange={(e) => setSimulationParams(prev => ({ ...prev, simulationCount: parseInt(e.target.value) }))}
                className="bg-zinc-900 border-zinc-700 text-emerald-500"
              />
            </div>
          </div>
        </div>
        <Button 
          onClick={runSimulation}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white mb-6"
        >
          Run Simulation
        </Button>
        {simulationResults.length > 0 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <ChartContainer
              config={{
                profit: {
                  label: "Average Profit",
                  color: "hsl(142.1 76.2% 36.3%)", // Emerald-600
                },
                winProbability: {
                  label: "Win Probability",
                  color: "hsl(142.1 70.6% 45.3%)", // Emerald-500
                },
              }}
              className="h-[400px] transition-all duration-500 ease-in-out transform hover:scale-[1.02]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={simulationResults} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis 
                    dataKey="tickCount" 
                    stroke="#fff"
                    label={{ value: 'Number of Ticks', position: 'bottom', fill: '#fff' }}
                  />
                  <YAxis 
                    yAxisId="left" 
                    stroke="#fff"
                    label={{ value: 'Profit ($)', angle: -90, position: 'left', fill: '#fff' }}
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    stroke="#fff"
                    label={{ value: 'Win Probability (%)', angle: 90, position: 'right', fill: '#fff' }}
                  />
                  <ChartTooltip 
                    content={<ChartTooltipContent />}
                    cursor={{ stroke: 'rgba(255,255,255,0.2)' }}
                  />
                  <Legend wrapperStyle={{ color: '#fff' }} />
                  <Line 
                    yAxisId="left" 
                    type="monotone" 
                    dataKey="profit" 
                    stroke="var(--color-profit)" 
                    name="Average Profit"
                    strokeWidth={2}
                    dot={{ fill: 'var(--color-profit)' }}
                    animationDuration={1000}
                    animationBegin={0}
                  />
                  <Line 
                    yAxisId="right" 
                    type="monotone" 
                    dataKey="winProbability" 
                    stroke="var(--color-winProbability)" 
                    name="Win Probability"
                    strokeWidth={2}
                    dot={{ fill: 'var(--color-winProbability)' }}
                    animationDuration={1000}
                    animationBegin={500}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
            <div className="grid grid-cols-3 gap-4 text-white bg-zinc-900/50 p-4 rounded-lg">
              <div className="space-y-1">
                <p className="text-sm text-white/80">Optimal Duration</p>
                <p className="text-xl font-mono text-emerald-500">
                  {simulationResults.reduce((max, result) => result.profit > max.profit ? result : max).tickCount} ticks
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-white/80">Max Avg. Profit</p>
                <p className="text-xl font-mono text-emerald-500">
                  ${simulationResults.reduce((max, result) => result.profit > max ? result.profit : max, 0).toFixed(2)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-white/80">Max Win Probability</p>
                <p className="text-xl font-mono text-emerald-500">
                  {simulationResults.reduce((max, result) => result.winProbability > max ? result.winProbability : max, 0).toFixed(2)}%
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default AccumulatorSimulation
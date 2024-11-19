"use client"

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useTradeHistory } from '../components/contexts/TradeHistoryContext'

const MARKET_FILTER_ALL = 'ALL_MARKETS'

const VOLATILITY_INDICES = {
  'V10_1S': 'Volatility 10 (1s) Index',
  'V25_1S': 'Volatility 25 (1s) Index',
  'V50_1S': 'Volatility 50 (1s) Index',
  'V75_1S': 'Volatility 75 (1s) Index',
  'V100_1S': 'Volatility 100 (1s) Index',
}

export function HistoriesPage() {
  const { tradeHistory } = useTradeHistory()
  const [marketFilter, setMarketFilter] = useState<string>(MARKET_FILTER_ALL)

  const filteredHistory = marketFilter === MARKET_FILTER_ALL
    ? tradeHistory
    : tradeHistory.filter(trade => trade.market === marketFilter)

  const uniqueMarkets = Array.from(new Set(tradeHistory.map(trade => trade.market)))

  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-2xl">Trade History</CardTitle>
          <CardDescription>
            View all your past Accumulator trades
          </CardDescription>
        </div>
        <Link href="/">
          <Button variant="outline">Go Back</Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <Select
            value={marketFilter}
            onValueChange={setMarketFilter}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue>
                {marketFilter === MARKET_FILTER_ALL ? "All Markets" : VOLATILITY_INDICES[marketFilter as keyof typeof VOLATILITY_INDICES]}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={MARKET_FILTER_ALL}>All Markets</SelectItem>
              {uniqueMarkets.map((market) => (
                <SelectItem key={market} value={market}>
                  {VOLATILITY_INDICES[market as keyof typeof VOLATILITY_INDICES]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {filteredHistory.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No trade history available
          </div>
        ) : (
          <div className="relative overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Market</TableHead>
                  <TableHead>Start Time</TableHead>
                  <TableHead>End Time</TableHead>
                  <TableHead className="text-right">Initial Stake</TableHead>
                  <TableHead className="text-right">Final Stake</TableHead>
                  <TableHead className="text-right">Profit</TableHead>
                  <TableHead className="text-right">Growth Rate</TableHead>
                  <TableHead className="text-right">Take Profit</TableHead>
                  <TableHead>Outcome</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHistory.map((trade) => (
                  <TableRow key={trade.id}>
                    <TableCell className="font-medium">{trade.market}</TableCell>
                    <TableCell>{formatDateTime(trade.startTime)}</TableCell>
                    <TableCell>{formatDateTime(trade.endTime)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(trade.initialStake)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(trade.finalStake)}</TableCell>
                    <TableCell className={`text-right ${trade.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(trade.profit)}
                    </TableCell>
                    <TableCell className="text-right">{trade.growthRate}%</TableCell>
                    <TableCell className="text-right">
                      {trade.takeProfitAmount ? formatCurrency(trade.takeProfitAmount) : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={trade.outcome === 'won' ? 'default' : 'destructive'}>
                        {trade.outcome.toUpperCase()}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
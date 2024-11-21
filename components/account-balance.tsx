'use client'

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw } from 'lucide-react'
import { useAccountBalance } from '@/components/contexts/AccountBalanceContext'

export function AccountBalance() {
  const { balance, resetBalance } = useAccountBalance()

  return (
    <Card className="bg-zinc-900 border-zinc-700 shadow-lg">
      <CardContent className="p-4 flex items-center justify-between space-x-4">
        <div>
          <p className="text-sm font-medium text-zinc-400">Account Balance</p>
          <p className="text-2xl font-bold text-white">${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={resetBalance}
          className="text-zinc-400 border-zinc-700 hover:bg-zinc-800 hover:text-white"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Reset
        </Button>
      </CardContent>
    </Card>
  )
}
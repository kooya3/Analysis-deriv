'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'

const INITIAL_BALANCE = 50000

interface AccountBalanceContextType {
  balance: number
  updateBalance: (change: number) => void
  resetBalance: () => void
}

const AccountBalanceContext = createContext<AccountBalanceContextType | undefined>(undefined)

export function AccountBalanceProvider({ children }: { children: React.ReactNode }) {
  const [balance, setBalance] = useState(INITIAL_BALANCE)

  const updateBalance = useCallback((change: number) => {
    setBalance(prevBalance => {
      const newBalance = prevBalance + change
      return Math.round(newBalance * 100) / 100 // Round to 2 decimal places
    })
  }, [])

  const resetBalance = useCallback(() => {
    setBalance(INITIAL_BALANCE)
  }, [])

  return (
    <AccountBalanceContext.Provider value={{ balance, updateBalance, resetBalance }}>
      {children}
    </AccountBalanceContext.Provider>
  )
}

export function useAccountBalance() {
  const context = useContext(AccountBalanceContext)
  if (context === undefined) {
    throw new Error('useAccountBalance must be used within an AccountBalanceProvider')
  }
  return context
}
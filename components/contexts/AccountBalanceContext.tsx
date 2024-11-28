'use client'

import { createContext, useContext, useState, useCallback } from 'react'

interface AccountBalanceContextType {
  balance: number
  updateBalance: (amount: number) => void
  resetBalance: () => void
}

const AccountBalanceContext = createContext<AccountBalanceContextType | undefined>(undefined)

const INITIAL_BALANCE = 60000

export function AccountBalanceProvider({ children }: { children: React.ReactNode }) {
  const [balance, setBalance] = useState(INITIAL_BALANCE)

  const updateBalance = useCallback((amount: number) => {
    setBalance(prevBalance => {
      const newBalance = prevBalance + amount
      if (newBalance < 0) {
        throw new Error('Insufficient balance')
      }
      return newBalance
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
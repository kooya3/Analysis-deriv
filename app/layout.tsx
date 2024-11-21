import "./globals.css"
import { Inter } from 'next/font/google'
import { TradeHistoryProvider } from "@/components/contexts/TradeHistoryContext"
import { ToastProvider } from "@/components/ui/toast"
import { AccountBalanceProvider } from '@/components/contexts/AccountBalanceContext'
import { AccountBalance } from '@/components/account-balance'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Trading Analysis Dashboard',
  description: 'Real-time trading analysis and predictions',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <TradeHistoryProvider>
          <ToastProvider>
            <AccountBalanceProvider>
              <div className="min-h-screen bg-background">
                <div className="container mx-auto py-6">
                  <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-center text-white">Trading Analysis Dashboard</h1>
                    <AccountBalance />
                  </div>
                  <div className="mt-4">
                    {children}
                  </div>
                </div>
              </div>
            </AccountBalanceProvider>
          </ToastProvider>
        </TradeHistoryProvider>
      </body>
    </html>
  )
}
import "./globals.css"
import { Inter } from 'next/font/google'
import { TradeHistoryProvider } from "@/components/contexts/TradeHistoryContext"
import { ToastProvider } from "@/components/ui/toast"

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
            <div className="min-h-screen bg-background">
              {children}
            </div>
          </ToastProvider>
        </TradeHistoryProvider>
      </body>
    </html>
  )
}
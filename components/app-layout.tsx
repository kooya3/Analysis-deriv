'use client'

import { TradeHistoryProvider } from "@/contexts/TradeHistoryContext"

export function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <TradeHistoryProvider>
          {children}
        </TradeHistoryProvider>
      </body>
    </html>
  )
}
"use client"

import { HistoriesPage } from "@/components/components-histories-page"

export default function HistoryPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-8">
          <HistoriesPage />
        </div>
      </main>
    </div>
  )
}
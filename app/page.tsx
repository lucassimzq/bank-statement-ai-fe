"use client"

import { useCallback, useEffect, useState } from "react"
import client from "@/lib/client"
import type { cards, transactions } from "@/lib/api"
import { Navbar } from "@/components/navbar"
import { CardFilter } from "@/components/dashboard/card-filter"
import { PeriodFilter } from "@/components/dashboard/period-filter"
import { CategoryDonutChart } from "@/components/dashboard/category-donut-chart"
import { TransactionList } from "@/components/dashboard/transaction-list"

export default function DashboardPage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [allCards, setAllCards] = useState<cards.Card[]>([])
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
  const [txns, setTxns] = useState<transactions.Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)
  // bump this to force a transaction re-fetch after upload
  const [refreshKey, setRefreshKey] = useState(0)

  // Fetch cards once on mount
  useEffect(() => {
    client.cards.ListCards().then((res) => setAllCards(res.cards))
  }, [])

  // Fetch transactions whenever card, period, or refreshKey changes
  useEffect(() => {
    if (allCards.length === 0) {
      setLoading(false)
      return
    }

    setLoading(true)
    setSelectedCategory(null)
    setExpanded(false)

    const cardsToFetch = selectedCardId
      ? allCards.filter((c) => c.id === selectedCardId)
      : allCards

    Promise.all(
      cardsToFetch.map((card) =>
        client.transactions
          .ListTransactions({ CardID: card.id, Year: year, Month: month, StatementID: "" })
          .then((res) => res.transactions)
          .catch(() => [] as transactions.Transaction[])
      )
    )
      .then((results) => setTxns(results.flat()))
      .finally(() => setLoading(false))
  }, [allCards, selectedCardId, year, month, refreshKey])

  const handleCategorySelect = (category: string | null) => {
    setSelectedCategory(category)
    if (category !== null) setExpanded(true)
  }

  const handleStatementUploaded = useCallback(() => {
    setRefreshKey((k) => k + 1)
  }, [])

  return (
    <>
      <Navbar onStatementUploaded={handleStatementUploaded} />

      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <div className="flex items-center gap-2">
            <CardFilter
              cards={allCards}
              selectedCardId={selectedCardId}
              onCardChange={setSelectedCardId}
            />
            <PeriodFilter year={year} month={month} onYearChange={setYear} onMonthChange={setMonth} />
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <>
            <CategoryDonutChart
              transactions={txns}
              selectedCategory={selectedCategory}
              onCategorySelect={handleCategorySelect}
            />
            <TransactionList
              transactions={txns}
              selectedCategory={selectedCategory}
              expanded={expanded}
              onToggle={() => setExpanded((v) => !v)}
            />
          </>
        )}
      </div>
    </>
  )
}

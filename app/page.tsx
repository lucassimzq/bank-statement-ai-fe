"use client"

import { useEffect, useState } from "react"
import client from "@/lib/client"
import type { cards, transactions } from "@/lib/api"
import { PeriodFilter } from "@/components/dashboard/period-filter"
import { CategoryDonutChart } from "@/components/dashboard/category-donut-chart"

export default function DashboardPage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [allCards, setAllCards] = useState<cards.Card[]>([])
  const [txns, setTxns] = useState<transactions.Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    client.cards.ListCards().then((res) => setAllCards(res.cards))
  }, [])

  useEffect(() => {
    if (allCards.length === 0) {
      setLoading(false)
      return
    }
    setLoading(true)
    Promise.all(
      allCards.map((card) =>
        client.transactions
          .ListTransactions({ CardID: card.id, Year: year, Month: month, StatementID: "" })
          .then((res) => res.transactions)
          .catch(() => [] as transactions.Transaction[])
      )
    )
      .then((results) => setTxns(results.flat()))
      .finally(() => setLoading(false))
  }, [allCards, year, month])

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <PeriodFilter year={year} month={month} onYearChange={setYear} onMonthChange={setMonth} />
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : (
        <CategoryDonutChart transactions={txns} />
      )}
    </div>
  )
}

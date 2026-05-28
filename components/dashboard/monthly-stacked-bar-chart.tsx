"use client"

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { cards, transactions } from "@/lib/api"

const BAR_COLORS = [
    "#6366f1", "#f59e0b", "#10b981", "#ef4444",
    "#3b82f6", "#ec4899", "#14b8a6", "#f97316",
]

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

interface Props {
    data: transactions.MonthlySpendingPoint[]
    cards: cards.Card[]
    selectedCardId?: string | null
    loading?: boolean
    onMonthClick?: (year: number, month: number) => void
}

export function MonthlyStackedBarChart({ data, cards, selectedCardId, loading, onMonthClick }: Props) {
    const cardMap = new Map(cards.map((c) => [c.id, c]))

    const filtered = selectedCardId ? data.filter((d) => d.card_id === selectedCardId) : data

    // All unique month keys sorted
    const monthKeys = Array.from(
        new Set(filtered.map((d) => `${d.year}-${String(d.month).padStart(2, "0")}`))
    ).sort().slice(-12)

    // All unique card IDs in filtered data
    const cardIds = Array.from(new Set(filtered.map((d) => d.card_id)))

    // Build chart rows: one per month, one key per card
    const chartData = monthKeys.map((key) => {
        const [y, m] = key.split("-")
        const row: Record<string, string | number> = {
            month: `${MONTH_LABELS[parseInt(m) - 1]} ${y}`,
        }
        let monthTotal = 0
        for (const cardId of cardIds) {
            const point = filtered.find(
                (d) => d.card_id === cardId &&
                    `${d.year}-${String(d.month).padStart(2, "0")}` === key
            )
            const val = point ? parseFloat(point.total) : 0
            row[cardId] = val
            monthTotal += val
        }
        row["__total"] = monthTotal
        return row
    })

    const cardLabel = (cardId: string) => {
        const card = cardMap.get(cardId)
        if (!card) return `••${cardId.slice(-4)}`
        return `${card.bank.name} ••${card.last4}`
    }

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Monthly Total Spending</CardTitle>
                    <CardDescription>Loading…</CardDescription>
                </CardHeader>
            </Card>
        )
    }

    if (chartData.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Monthly Total Spending</CardTitle>
                    <CardDescription>No data available yet — upload a statement to see your monthly totals</CardDescription>
                </CardHeader>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Monthly Total Spending</CardTitle>
                <CardDescription>
                    {selectedCardId
                        ? `Spending for ${cardLabel(selectedCardId)} by month (MYR)`
                        : "Total spend stacked by card per month (MYR)"}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={288}>
                    <BarChart
                        data={chartData}
                        margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
                        onClick={(e) => {
                            if (!onMonthClick || !e?.activeLabel) return
                            const [mon, yr] = (e.activeLabel as string).split(" ")
                            const month = MONTH_LABELS.indexOf(mon) + 1
                            const year = parseInt(yr)
                            if (month > 0 && !isNaN(year)) onMonthClick(year, month)
                        }}
                        style={{ cursor: onMonthClick ? "pointer" : undefined }}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                        <YAxis
                            tick={{ fontSize: 12 }}
                            tickFormatter={(v) => `${Number(v).toFixed(0)}`}
                            width={60}
                        />
                        <Tooltip
                            formatter={(value, name) => [
                                `MYR ${Number(value).toFixed(2)}`,
                                cardLabel(name as string),
                            ]}
                            contentStyle={{
                                fontSize: 12,
                                borderRadius: "8px",
                                border: "1px solid hsl(var(--border))",
                                background: "hsl(var(--card))",
                                color: "hsl(var(--card-foreground))",
                            }}
                            // Show total at the bottom of the tooltip
                            itemSorter={() => -1}
                        />
                        <Legend
                            formatter={(value) => (
                                <span style={{ fontSize: 12 }}>{cardLabel(value)}</span>
                            )}
                        />
                        {cardIds.map((cardId, i) => (
                            <Bar
                                key={cardId}
                                dataKey={cardId}
                                stackId="stack"
                                fill={BAR_COLORS[i % BAR_COLORS.length]}
                                radius={i === cardIds.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                            />
                        ))}
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}

"use client"

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import type {cards, transactions} from "@/lib/api"

const LINE_COLORS = [
    "#6366f1", "#f59e0b", "#10b981", "#ef4444",
    "#3b82f6", "#ec4899", "#14b8a6", "#f97316",
]

interface Props {
    data: transactions.MonthlySpendingPoint[]
    cards: cards.Card[]
    selectedCardId?: string | null
    loading?: boolean
}

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

export function SpendingTrendChart({data, cards, selectedCardId, loading}: Props) {
    const cardMap = new Map(cards.map((c) => [c.id, c]))

    // Apply card filter
    const filtered = selectedCardId ? data.filter((d) => d.card_id === selectedCardId) : data

    // Build sorted list of unique "YYYY-MM" keys for the last 12 months that have data
    const monthKeys = Array.from(
        new Set(filtered.map((d) => `${d.year}-${String(d.month).padStart(2, "0")}`))
    ).sort().slice(-12)

    // Get unique card IDs that appear in the filtered data
    const cardIds = Array.from(new Set(filtered.map((d) => d.card_id)))

    // Build chart rows: one entry per month, with a key per card
    const chartData = monthKeys.map((key) => {
        const [y, m] = key.split("-")
        const label = `${MONTH_LABELS[parseInt(m) - 1]} ${y}`
        const row: Record<string, string | number> = {month: label}
        for (const cardId of cardIds) {
            const point = filtered.find(
                (d) => d.card_id === cardId &&
                    `${d.year}-${String(d.month).padStart(2, "0")}` === key
            )
            row[cardId] = point ? parseFloat(point.total) : 0
        }
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
                    <CardTitle>Monthly Spending Trend (By Card)</CardTitle>
                    <CardDescription>Loading…</CardDescription>
                </CardHeader>
            </Card>
        )
    }

    if (chartData.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Monthly Spending Trend (By Card)</CardTitle>
                    <CardDescription>No data available yet — upload a statement to see your trend</CardDescription>
                </CardHeader>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Monthly Spending Trend (By Card)</CardTitle>
                <CardDescription>Total spend per card across months (MYR)</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={288}>
                    <AreaChart data={chartData} margin={{top: 4, right: 16, left: 0, bottom: 0}}>
                        <defs>
                            {cardIds.map((cardId, i) => (
                                <linearGradient key={cardId} id={`gradient-${i}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={LINE_COLORS[i % LINE_COLORS.length]} stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor={LINE_COLORS[i % LINE_COLORS.length]} stopOpacity={0}/>
                                </linearGradient>
                            ))}
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted"/>
                        <XAxis
                            dataKey="month"
                            tick={{fontSize: 12}}
                            className="text-muted-foreground"
                        />
                        <YAxis
                            tick={{fontSize: 12}}
                            tickFormatter={(v) => `${Number(v).toFixed(0)}`}
                            width={60}
                            className="text-muted-foreground"
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
                        />
                        <Legend
                            formatter={(value) => (
                                <span style={{fontSize: 12}}>{cardLabel(value)}</span>
                            )}
                        />
                        {cardIds.map((cardId, i) => (
                            <Area
                                key={cardId}
                                type="monotone"
                                dataKey={cardId}
                                stroke={LINE_COLORS[i % LINE_COLORS.length]}
                                strokeWidth={2}
                                fill={`url(#gradient-${i})`}
                                dot={{r: 3}}
                                activeDot={{r: 5}}
                            />
                        ))}
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}

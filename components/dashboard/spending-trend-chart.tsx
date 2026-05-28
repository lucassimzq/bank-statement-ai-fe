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

// Dark-mode calibrated palette — mirrors the bar chart colours exactly
// so both charts speak the same visual language.
const LINE_COLORS = [
    "#6B9EC4", // blue     — H 206  S 45%  L 60%
    "#D9924F", // amber    — H  29  S 62%  L 58%
    "#6DB562", // green    — H 112  S 36%  L 55%
    "#D47878", // coral    — H   0  S 50%  L 65%
    "#82C4C0", // teal     — H 177  S 40%  L 63%
    "#BB8EB7", // mauve    — H 303  S 30%  L 63%
    "#D4C062", // gold     — H  46  S 60%  L 61%
    "#D4909A", // blush    — H 350  S 45%  L 70%
]

// ── Custom tooltip ────────────────────────────────────────────────────────────

interface TooltipPayloadEntry {
    dataKey: string
    value: number
    color: string
}

function AreaTooltip({
    active, payload, label, getLabel,
}: {
    active?: boolean
    payload?: TooltipPayloadEntry[]
    label?: string
    getLabel: (key: string) => string
}) {
    if (!active || !payload?.length) return null
    return (
        <div style={{
            background: "#1a1a2e",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 8,
            padding: "10px 14px",
            fontSize: 12,
            minWidth: 200,
            boxShadow: "0 8px 32px rgba(0,0,0,0.7)",
        }}>
            <p style={{ fontWeight: 700, marginBottom: 6, color: "#ffffff" }}>
                {label}
            </p>
            {payload.map((entry) => (
                <div key={entry.dataKey} style={{
                    display: "flex", alignItems: "center",
                    gap: 8, marginBottom: 3,
                }}>
                    <span style={{
                        width: 8, height: 8, borderRadius: "50%",
                        background: entry.color, flexShrink: 0,
                    }} />
                    <span style={{ color: "rgba(255,255,255,0.65)", flex: 1 }}>
                        {getLabel(entry.dataKey)}
                    </span>
                    <span style={{ fontWeight: 600, color: "#ffffff" }}>
                        MYR {Number(entry.value).toFixed(2)}
                    </span>
                </div>
            ))}
        </div>
    )
}

interface Props {
    data: transactions.MonthlySpendingPoint[]
    cards: cards.Card[]
    selectedCardId?: string | null
    loading?: boolean
    onMonthClick?: (year: number, month: number) => void
}

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

export function SpendingTrendChart({data, cards, selectedCardId, loading, onMonthClick}: Props) {
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
                    <AreaChart
                        data={chartData}
                        margin={{top: 4, right: 16, left: 0, bottom: 0}}
                        onClick={(e) => {
                            if (!onMonthClick || !e?.activeLabel) return
                            const [mon, yr] = (e.activeLabel as string).split(" ")
                            const month = MONTH_LABELS.indexOf(mon) + 1
                            const year = parseInt(yr)
                            if (month > 0 && !isNaN(year)) onMonthClick(year, month)
                        }}
                        style={{ cursor: onMonthClick ? "pointer" : undefined }}
                    >
                        <defs>
                            {cardIds.map((cardId, i) => (
                                <linearGradient key={cardId} id={`gradient-${i}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%"  stopColor={LINE_COLORS[i % LINE_COLORS.length]} stopOpacity={0.25}/>
                                    <stop offset="95%" stopColor={LINE_COLORS[i % LINE_COLORS.length]} stopOpacity={0}/>
                                </linearGradient>
                            ))}
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))"/>
                        <XAxis dataKey="month" tick={{fontSize: 12}}/>
                        <YAxis
                            tick={{fontSize: 12}}
                            tickFormatter={(v) => `${Number(v).toFixed(0)}`}
                            width={60}
                        />
                        <Tooltip
                            cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1 }}
                            content={(props) => (
                                <AreaTooltip
                                    active={props.active}
                                    payload={props.payload as unknown as TooltipPayloadEntry[]}
                                    label={props.label as string}
                                    getLabel={cardLabel}
                                />
                            )}
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

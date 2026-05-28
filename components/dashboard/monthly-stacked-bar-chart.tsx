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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { cards, transactions } from "@/lib/api"

// Dark-mode calibrated palette — same hue families as Tableau 10 but
// saturation 40–60 % and lightness 58–68 % so colours read softly on
// near-black backgrounds without looking washed out.
const BAR_COLORS = [
  "#6B9EC4", // blue     — H 206  S 45%  L 60%
  "#D9924F", // amber    — H  29  S 62%  L 58%
  "#6DB562", // green    — H 112  S 36%  L 55%
  "#D47878", // coral    — H   0  S 50%  L 65%
  "#82C4C0", // teal     — H 177  S 40%  L 63%
  "#BB8EB7", // mauve    — H 303  S 30%  L 63%
  "#D4C062", // gold     — H  46  S 60%  L 61%
  "#D4909A", // blush    — H 350  S 45%  L 70%
]

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
]

// ── Custom tooltip ────────────────────────────────────────────────────────────

interface TooltipPayloadEntry {
  dataKey: string
  value: number
  color: string
}

function BarTooltip({
  active,
  payload,
  label,
  getLabel,
}: {
  active?: boolean
  payload?: TooltipPayloadEntry[]
  label?: string
  getLabel: (key: string) => string
}) {
  if (!active || !payload?.length) return null

  const total = payload.reduce((s, e) => s + (e.value ?? 0), 0)

  return (
    <div
      style={{
        background: "#1a1a2e",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 8,
        padding: "10px 14px",
        fontSize: 12,
        minWidth: 200,
        boxShadow: "0 8px 32px rgba(0,0,0,0.7)",
      }}
    >
      <p style={{ fontWeight: 700, marginBottom: 6, color: "#ffffff" }}>
        {label}
      </p>
      {[...payload].reverse().map((entry) => (
        <div
          key={entry.dataKey}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 3,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: entry.color,
              flexShrink: 0,
            }}
          />
          <span style={{ color: "rgba(255,255,255,0.65)", flex: 1 }}>
            {getLabel(entry.dataKey)}
          </span>
          <span style={{ fontWeight: 600, color: "#ffffff" }}>
            MYR {Number(entry.value).toFixed(2)}
          </span>
        </div>
      ))}
      {payload.length > 1 && (
        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.12)",
            marginTop: 6,
            paddingTop: 6,
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span style={{ color: "rgba(255,255,255,0.65)" }}>Total</span>
          <span style={{ fontWeight: 700, color: "#ffffff" }}>
            MYR {total.toFixed(2)}
          </span>
        </div>
      )}
    </div>
  )
}

// ── Custom bar shape — rounds the top of the visually topmost segment ────────
//
// Recharts' radius prop is per-Bar-component, so it always rounds the last
// dataKey — even when that card has $0 for a given month. This shape checks at
// render time: if every card above this one is 0, this IS the top → round it.

interface RoundedBarProps {
  x?: number
  y?: number
  width?: number
  height?: number
  fill?: string
  [key: string]: unknown
}

// Returns a custom shape component for a given card.
// The shape prop receives the full data row for that column (month),
// so we can check per-column which card is the actual topmost non-zero segment.
function makeTopRoundedBar(
  cardId: string,
  cardIds: string[],
  chartData: Record<string, string | number>[]
) {
  return function TopRoundedBar(props: RoundedBarProps) {
    const { x = 0, y = 0, width = 0, height = 0, fill } = props
    if (!height || height <= 0) return null

    // Recharts injects the full row data into the shape props (including "month")
    const monthLabel = props["month"] as string | undefined
    const row = chartData.find((d) => d.month === monthLabel)

    const myIndex = cardIds.indexOf(cardId)
    // This card is visually the top of the stack for this column if every
    // card rendered above it (higher index = higher in stack) has value 0
    const isTop =
      !row ||
      cardIds.slice(myIndex + 1).every((id) => !row[id] || row[id] === 0)
    const isBottom =
      !row || cardIds.slice(0, myIndex).every((id) => !row[id] || row[id] === 0)

    const r = Math.min(8, width / 2, height)
    if (isTop) {
      return (
        <path
          d={`M${x},${y + height} L${x},${y + r} Q${x},${y} ${x + r},${y} L${x + width - r},${y} Q${x + width},${y} ${x + width},${y + r} L${x + width},${y + height} Z`}
          fill={fill}
        />
      )
    }

    if (isBottom) {
      return (
        <path
          d={`M${x},${y} L${x + width},${y} L${x + width},${y + height - r} Q${x + width},${y + height} ${x + width - r},${y + height} L${x + r},${y + height} Q${x},${y + height} ${x},${y + height - r} Z`}
          fill={fill}
        />
      )
    }

    return <rect x={x} y={y} width={width} height={height} fill={fill} />
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  data: transactions.MonthlySpendingPoint[]
  cards: cards.Card[]
  selectedCardId?: string | null
  loading?: boolean
  onMonthClick?: (year: number, month: number) => void
}

export function MonthlyStackedBarChart({
  data,
  cards,
  selectedCardId,
  loading,
  onMonthClick,
}: Props) {
  const cardMap = new Map(cards.map((c) => [c.id, c]))

  const filtered = selectedCardId
    ? data.filter((d) => d.card_id === selectedCardId)
    : data

  const monthKeys = Array.from(
    new Set(
      filtered.map((d) => `${d.year}-${String(d.month).padStart(2, "0")}`)
    )
  )
    .sort()
    .slice(-12)

  const cardIds = Array.from(new Set(filtered.map((d) => d.card_id)))

  const chartData = monthKeys.map((key) => {
    const [y, m] = key.split("-")
    const row: Record<string, string | number> = {
      month: `${MONTH_LABELS[parseInt(m) - 1]} ${y}`,
    }
    for (const cardId of cardIds) {
      const point = filtered.find(
        (d) =>
          d.card_id === cardId &&
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
          <CardDescription>
            No data available yet — upload a statement to see your monthly
            totals
          </CardDescription>
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
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="hsl(var(--border))"
            />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis
              tick={{ fontSize: 12 }}
              tickFormatter={(v) => `${Number(v).toFixed(0)}`}
              width={60}
            />
            {/* Subtle white veil cursor — barely-there highlight */}
            <Tooltip
              cursor={{ fill: "rgba(255, 255, 255, 0.05)" }}
              content={(props) => (
                <BarTooltip
                  active={props.active}
                  payload={props.payload as unknown as TooltipPayloadEntry[]}
                  label={props.label as string}
                  getLabel={cardLabel}
                />
              )}
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
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                shape={makeTopRoundedBar(cardId, cardIds, chartData) as any}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

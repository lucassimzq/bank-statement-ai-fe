"use client"

import { Pie, PieChart, Cell, Tooltip, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { transactions } from "@/lib/api"

const COLORS = [
  "#6366f1", "#f59e0b", "#10b981", "#ef4444", "#3b82f6",
  "#ec4899", "#14b8a6", "#f97316", "#8b5cf6", "#84cc16",
]

interface Props {
  transactions: transactions.Transaction[]
  selectedCategory: string | null
  onCategorySelect: (category: string | null) => void
}

export function CategoryDonutChart({ transactions, selectedCategory, onCategorySelect }: Props) {
  const totals = transactions.reduce<Record<string, number>>((acc, t) => {
    const amount = parseFloat(t.amount)
    if (amount <= 0) return acc
    acc[t.category_name] = (acc[t.category_name] ?? 0) + amount
    return acc
  }, {})

  const data = Object.entries(totals)
    .map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }))
    .sort((a, b) => b.value - a.value)

  const total = data.reduce((sum, d) => sum + d.value, 0)

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Spending by Category</CardTitle>
          <CardDescription>No transactions for this period</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const handleSliceClick = (entry: { name?: string }) => {
    if (!entry.name) return
    onCategorySelect(selectedCategory === entry.name ? null : entry.name)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spending by Category</CardTitle>
        <CardDescription>
          Total: MYR {total.toFixed(2)}
          {selectedCategory && (
            <button
              onClick={() => onCategorySelect(null)}
              className="ml-3 text-xs underline underline-offset-2 hover:text-foreground transition-colors"
            >
              Clear selection
            </button>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <div className="h-64 w-64 shrink-0 mx-auto sm:mx-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius="55%"
                outerRadius="80%"
                dataKey="value"
                strokeWidth={0}
                onClick={handleSliceClick}
                style={{ cursor: "pointer" }}
              >
                {data.map((d, i) => (
                  <Cell
                    key={i}
                    fill={COLORS[i % COLORS.length]}
                    opacity={selectedCategory && selectedCategory !== d.name ? 0.3 : 1}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`MYR ${Number(value).toFixed(2)}`, ""]} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <ul className="flex flex-col gap-2.5 text-sm w-full">
          {data.map((d, i) => (
            <li
              key={d.name}
              onClick={() => handleSliceClick(d)}
              className={`flex items-center gap-2 cursor-pointer rounded-md px-2 py-1 transition-colors hover:bg-muted/50 ${
                selectedCategory && selectedCategory !== d.name ? "opacity-30" : ""
              }`}
            >
              <span
                className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                style={{ background: COLORS[i % COLORS.length] }}
              />
              <span className="text-muted-foreground">{d.name}</span>
              <span className="ml-auto font-medium tabular-nums">
                MYR {d.value.toFixed(2)}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

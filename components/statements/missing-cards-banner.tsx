"use client"

import { Upload, AlertTriangle } from "lucide-react"
import type { cards, statements } from "@/lib/api"

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

interface Props {
    allCards: cards.Card[]
    statements: statements.StatementWithCards[]
    onUploadNow: () => void
}

export function MissingCardsBanner({ allCards, statements, onUploadNow }: Props) {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1

    // Collect card IDs that have a *parsed* card_statement entry for this month
    const parsedCardIds = new Set<string>()
    for (const stmt of statements) {
        if (stmt.year !== year || stmt.month !== month) continue
        for (const c of stmt.cards) {
            if (c.status === 1 && c.card_id) {
                parsedCardIds.add(c.card_id)
            }
        }
    }

    // Cards with no parsed statement this month
    const missing = allCards.filter((c) => !parsedCardIds.has(c.id))

    if (missing.length === 0) return null

    const monthLabel = `${MONTHS[month - 1]} ${year}`

    return (
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 px-4 py-3">
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-yellow-600 dark:text-yellow-400" />
                    <div className="space-y-1.5">
                        <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                            {missing.length === 1
                                ? `1 card is missing a statement for ${monthLabel}`
                                : `${missing.length} cards are missing statements for ${monthLabel}`}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            {missing.map((card) => (
                                <span
                                    key={card.id}
                                    className="inline-flex items-center gap-1 rounded-md border border-yellow-500/30 bg-background px-2 py-0.5 text-xs font-medium"
                                >
                                    <span className="text-muted-foreground">{card.bank.name}</span>
                                    <span className="font-mono">···{card.last4}</span>
                                    {card.label && (
                                        <span className="text-muted-foreground">· {card.label}</span>
                                    )}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                <button
                    onClick={onUploadNow}
                    className="shrink-0 inline-flex items-center gap-1.5 rounded-md bg-yellow-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-yellow-700 transition-colors"
                >
                    <Upload className="h-3.5 w-3.5" />
                    Upload Now
                </button>
            </div>
        </div>
    )
}

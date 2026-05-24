"use client"

import {ChevronDown, ChevronUp} from "lucide-react"
import type {cards, transactions} from "@/lib/api"
import { Badge } from "@/components/ui/badge"

interface Props {
    transactions: transactions.Transaction[]
    cards: cards.Card[]
    selectedCategory: string | null
    expanded: boolean
    onToggle: () => void
}

export function TransactionList({transactions, cards, selectedCategory, expanded, onToggle}: Props) {
    const cardMap = new Map(cards.map((c) => [c.id, c]))

    const filtered = selectedCategory
        ? transactions.filter((t) => t.category_name === selectedCategory)
        : transactions

    const visible = filtered.filter((t) => parseFloat(t.amount) > 0)

    return (
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
            <button
                onClick={onToggle}
                className="flex w-full items-center justify-between px-6 py-4 text-sm font-medium hover:bg-muted/50 transition-colors rounded-xl"
            >
        <span>
          {selectedCategory ? `${selectedCategory} transactions` : "All transactions"}
            <span className="ml-2 text-muted-foreground font-normal">({visible.length})</span>
        </span>
                {expanded ? <ChevronUp className="h-4 w-4"/> : <ChevronDown className="h-4 w-4"/>}
            </button>

            {expanded && (
                <div className="border-t">
                    {visible.length === 0 ? (
                        <p className="px-6 py-4 text-sm text-muted-foreground">No transactions found.</p>
                    ) : (
                        <ul className="divide-y">
                            {visible.map((t) => {
                                const card = cardMap.get(t.card_id)
                                return (
                                    <li key={t.id} className="flex items-center justify-between px-6 py-3 text-sm">
                                        <div className="flex flex-col gap-0.5 min-w-0">
                                            <span className="font-medium truncate">{t.merchant}</span>
                                            <div className="flex items-center gap-1 flex-wrap mt-0.5">
                                                <Badge>
                                                    {new Date(t.txn_date).toLocaleDateString("en-MY", {
                                                        day: "numeric",
                                                        month: "short",
                                                        year: "numeric",
                                                    })}
                                                </Badge>
                                                <Badge>{t.category_name}</Badge>
                                                {card && (
                                                    <Badge>
                                                        {card.bank.logo_url ? (
                                                            // eslint-disable-next-line @next/next/no-img-element
                                                            <img
                                                                src={card.bank.logo_url}
                                                                alt={card.bank.name}
                                                                width={12}
                                                                height={12}
                                                                className="rounded-sm object-contain"
                                                            />
                                                        ) : (
                                                            <span>{card.bank.name}</span>
                                                        )}
                                                        ••{card.last4}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                        <span className="ml-4 shrink-0 font-medium tabular-nums">
                      MYR {parseFloat(t.amount).toFixed(2)}
                    </span>
                                    </li>
                                )
                            })}
                        </ul>
                    )}
                </div>
            )}
        </div>
    )
}

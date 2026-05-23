"use client"

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import type { cards } from "@/lib/api"

const ALL_CARDS = "__all__"

interface Props {
    cards: cards.Card[]
    selectedCardId: string | null
    onCardChange: (cardId: string | null) => void
}

export function CardFilter({ cards, selectedCardId, onCardChange }: Props) {
    const value = selectedCardId ?? ALL_CARDS

    return (
        <Select
            value={value}
            onValueChange={(v) => onCardChange(v === ALL_CARDS ? null : v)}
        >
            <SelectTrigger className="w-48">
                <SelectValue placeholder="All Cards" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value={ALL_CARDS}>All Cards</SelectItem>
                {cards.map((card) => (
                    <SelectItem key={card.id} value={card.id}>
                        <span className="flex items-center gap-2">
                            {card.bank.logo_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={card.bank.logo_url}
                                    alt={card.bank.name}
                                    width={20}
                                    height={20}
                                    className="rounded-sm object-contain"
                                />
                            ) : (
                                <span className="w-5 h-5 rounded-sm bg-muted flex items-center justify-center text-[10px] font-medium text-muted-foreground">
                                    {card.bank.name[0]}
                                </span>
                            )}
                            <span>•••• {card.last4}</span>
                        </span>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}

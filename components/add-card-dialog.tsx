"use client"

import { useEffect, useState } from "react"
import { CreditCard } from "lucide-react"
import client from "@/lib/client"
import type { cards } from "@/lib/api"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface Props {
    onCreated?: () => void
}

export function AddCardDialog({ onCreated }: Props) {
    const [open, setOpen] = useState(false)
    const [banks, setBanks] = useState<cards.Bank[]>([])
    const [bankId, setBankId] = useState("")
    const [label, setLabel] = useState("")
    const [purpose, setPurpose] = useState("")
    const [last4, setLast4] = useState("")
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState("")

    useEffect(() => {
        client.cards.ListBanks().then((res) => {
            setBanks(res.banks)
            if (res.banks.length > 0) setBankId(res.banks[0].id)
        })
    }, [])

    const reset = () => {
        setLabel("")
        setPurpose("")
        setLast4("")
        setError("")
        setSubmitting(false)
    }

    const handleOpenChange = (v: boolean) => {
        setOpen(v)
        if (!v) reset()
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!bankId) return

        setSubmitting(true)
        setError("")

        try {
            await client.cards.CreateCard({
                bank_id: bankId,
                label: label.trim(),
                purpose: purpose.trim(),
                last4: last4.trim(),
            })
            onCreated?.()
            handleOpenChange(false)
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to create card"
            setError(msg)
            setSubmitting(false)
        }
    }

    const selectedBank = banks.find((b) => b.id === bankId)
    const isValid = bankId && label.trim() && purpose.trim() && last4.trim().length === 4

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="gap-2">
                    <CreditCard className="h-4 w-4" />
                    Add Card
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Add New Card</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                    {/* Bank */}
                    <div className="space-y-1.5">
                        <Label>Bank</Label>
                        <Select value={bankId} onValueChange={setBankId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a bank">
                                    {selectedBank && (
                                        <span className="flex items-center gap-2">
                                            {selectedBank.logo_url ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={selectedBank.logo_url}
                                                    alt={selectedBank.name}
                                                    width={18}
                                                    height={18}
                                                    className="rounded-sm object-contain"
                                                />
                                            ) : (
                                                <span className="w-[18px] h-[18px] rounded-sm bg-muted flex items-center justify-center text-[10px] font-medium text-muted-foreground">
                                                    {selectedBank.name[0]}
                                                </span>
                                            )}
                                            <span>{selectedBank.name}</span>
                                        </span>
                                    )}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {banks.map((bank) => (
                                    <SelectItem key={bank.id} value={bank.id}>
                                        <span className="flex items-center gap-2">
                                            {bank.logo_url ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={bank.logo_url}
                                                    alt={bank.name}
                                                    width={18}
                                                    height={18}
                                                    className="rounded-sm object-contain"
                                                />
                                            ) : (
                                                <span className="w-[18px] h-[18px] rounded-sm bg-muted flex items-center justify-center text-[10px] font-medium text-muted-foreground">
                                                    {bank.name[0]}
                                                </span>
                                            )}
                                            <span>{bank.name}</span>
                                        </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Label */}
                    <div className="space-y-1.5">
                        <Label htmlFor="card-label">Label</Label>
                        <Input
                            id="card-label"
                            placeholder="e.g. Personal, Work"
                            value={label}
                            onChange={(e) => setLabel(e.target.value)}
                        />
                    </div>

                    {/* Purpose */}
                    <div className="space-y-1.5">
                        <Label htmlFor="card-purpose">Purpose</Label>
                        <Input
                            id="card-purpose"
                            placeholder="e.g. Daily expenses, Travel"
                            value={purpose}
                            onChange={(e) => setPurpose(e.target.value)}
                        />
                    </div>

                    {/* Last 4 digits */}
                    <div className="space-y-1.5">
                        <Label htmlFor="card-last4">Last 4 digits</Label>
                        <Input
                            id="card-last4"
                            placeholder="1234"
                            maxLength={4}
                            value={last4}
                            onChange={(e) => setLast4(e.target.value.replace(/\D/g, ""))}
                        />
                    </div>

                    {error && <p className="text-sm text-destructive">{error}</p>}

                    <Button
                        type="submit"
                        className="w-full"
                        disabled={!isValid || submitting}
                    >
                        {submitting ? "Creating…" : "Create Card"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}

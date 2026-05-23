"use client"

import { useEffect, useRef, useState } from "react"
import { Upload } from "lucide-react"
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
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
]
const YEARS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)

interface Props {
    onUploaded?: () => void
}

export function UploadStatementDialog({ onUploaded }: Props) {
    const now = new Date()
    const [open, setOpen] = useState(false)
    const [allCards, setAllCards] = useState<cards.Card[]>([])
    const [cardId, setCardId] = useState("")
    const [year, setYear] = useState(now.getFullYear())
    const [month, setMonth] = useState(now.getMonth() + 1)
    const [file, setFile] = useState<File | null>(null)
    const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle")
    const [errorMsg, setErrorMsg] = useState("")
    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        client.cards.ListCards().then((res) => {
            setAllCards(res.cards)
            if (res.cards.length > 0) setCardId(res.cards[0].id)
        })
    }, [])

    const reset = () => {
        setFile(null)
        setStatus("idle")
        setErrorMsg("")
        if (fileInputRef.current) fileInputRef.current.value = ""
    }

    const handleOpenChange = (v: boolean) => {
        setOpen(v)
        if (!v) reset()
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!file || !cardId) return

        setStatus("uploading")
        setErrorMsg("")

        try {
            const form = new FormData()
            form.append("card_id", cardId)
            form.append("year", String(year))
            form.append("month", String(month))
            form.append("file", file)

            const res = await client.statements.Upload("POST", form)
            if (!res.ok) {
                const text = await res.text()
                throw new Error(text || `HTTP ${res.status}`)
            }

            setStatus("success")
            onUploaded?.()
            setTimeout(() => handleOpenChange(false), 1200)
        } catch (err) {
            setStatus("error")
            setErrorMsg(err instanceof Error ? err.message : "Upload failed")
        }
    }

    const selectedCard = allCards.find((c) => c.id === cardId)

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                    <Upload className="h-4 w-4" />
                    Upload Statement
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Upload Bank Statement</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                    {/* Card */}
                    <div className="space-y-1.5">
                        <Label>Card</Label>
                        <Select value={cardId} onValueChange={setCardId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a card">
                                    {selectedCard && (
                                        <span className="flex items-center gap-2">
                                            {selectedCard.bank.logo_url && (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={selectedCard.bank.logo_url}
                                                    alt={selectedCard.bank.name}
                                                    width={18}
                                                    height={18}
                                                    className="rounded-sm object-contain"
                                                />
                                            )}
                                            <span>{selectedCard.bank.name} •••• {selectedCard.last4}</span>
                                        </span>
                                    )}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {allCards.map((card) => (
                                    <SelectItem key={card.id} value={card.id}>
                                        <span className="flex items-center gap-2">
                                            {card.bank.logo_url ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={card.bank.logo_url}
                                                    alt={card.bank.name}
                                                    width={18}
                                                    height={18}
                                                    className="rounded-sm object-contain"
                                                />
                                            ) : (
                                                <span className="w-[18px] h-[18px] rounded-sm bg-muted flex items-center justify-center text-[10px] font-medium text-muted-foreground">
                                                    {card.bank.name[0]}
                                                </span>
                                            )}
                                            <span>{card.bank.name} •••• {card.last4}</span>
                                        </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Year + Month */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label>Year</Label>
                            <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {YEARS.map((y) => (
                                        <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label>Month</Label>
                            <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {MONTHS.map((name, i) => (
                                        <SelectItem key={i + 1} value={String(i + 1)}>{name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* File */}
                    <div className="space-y-1.5">
                        <Label>PDF Statement</Label>
                        <div
                            className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/30 p-6 text-center cursor-pointer hover:border-muted-foreground/60 transition-colors"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {file ? (
                                <>
                                    <Upload className="h-6 w-6 text-muted-foreground" />
                                    <p className="text-sm font-medium">{file.name}</p>
                                    <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
                                </>
                            ) : (
                                <>
                                    <Upload className="h-6 w-6 text-muted-foreground" />
                                    <p className="text-sm text-muted-foreground">Click to select a PDF</p>
                                </>
                            )}
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="application/pdf"
                            className="hidden"
                            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                        />
                    </div>

                    {/* Error */}
                    {status === "error" && (
                        <p className="text-sm text-destructive">{errorMsg}</p>
                    )}

                    {/* Submit */}
                    <Button
                        type="submit"
                        className="w-full"
                        disabled={!file || !cardId || status === "uploading"}
                    >
                        {status === "uploading" ? "Uploading & parsing…" :
                         status === "success"   ? "Done!" :
                         "Upload & Parse"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}

"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Info } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { StatementTable } from "@/components/statements/statement-table"
import { MissingCardsBanner } from "@/components/statements/missing-cards-banner"
import { UploadStatementDialog } from "@/components/upload-statement-dialog"
import client from "@/lib/client"
import type { cards, statements } from "@/lib/api"

export default function StatementsPage() {
    const [items, setItems] = useState<statements.StatementWithCards[]>([])
    const [allCards, setAllCards] = useState<cards.Card[]>([])
    const [loading, setLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState<"all" | "parsing" | "parsed" | "error">("all")
    const [uploadOpen, setUploadOpen] = useState(false)
    const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    // Fetch cards once on mount
    useEffect(() => {
        client.cards.ListCards().then((res) => setAllCards(res.cards))
    }, [])

    const fetchStatements = useCallback(async () => {
        try {
            const res = await client.statements.ListStatements({ CardID: "" })
            setItems(res.statements)
            return res.statements
        } catch {
            return []
        } finally {
            setLoading(false)
        }
    }, [])

    // Auto-poll every 3 s while any statement is still parsing
    useEffect(() => {
        let alive = true

        const tick = async () => {
            const stmts = await fetchStatements()
            const hasParsing = stmts.some((s) => s.status === 0)
            if (alive && hasParsing) {
                pollRef.current = setTimeout(tick, 3000)
            }
        }

        tick()
        return () => {
            alive = false
            if (pollRef.current) clearTimeout(pollRef.current)
        }
    }, [fetchStatements])

    const handleRetry = async (id: string) => {
        await client.statements.RetryStatement(id)
        setItems((prev) =>
            prev.map((s) =>
                s.id === id
                    ? ({ ...s, status: 0, message: "" } as statements.StatementWithCards)
                    : s
            )
        )
        const poll = async () => {
            const stmts = await fetchStatements()
            if (stmts.some((s) => s.status === 0)) {
                pollRef.current = setTimeout(poll, 3000)
            }
        }
        pollRef.current = setTimeout(poll, 3000)
    }

    const handleDelete = async (id: string) => {
        await client.statements.DeleteStatement(id)
        setItems((prev) => prev.filter((s) => s.id !== id))
    }

    // After upload completes: re-fetch statements + cards, then start polling if needed
    const handleUploaded = useCallback(() => {
        fetchStatements().then((stmts) => {
            if (stmts.some((s) => s.status === 0)) {
                const poll = async () => {
                    const updated = await fetchStatements()
                    if (updated.some((s) => s.status === 0)) {
                        pollRef.current = setTimeout(poll, 3000)
                    }
                }
                pollRef.current = setTimeout(poll, 3000)
            }
        })
    }, [fetchStatements])

    const filtered = items.filter((s) => {
        if (statusFilter === "all") return true
        if (statusFilter === "parsing") return s.status === 0
        if (statusFilter === "parsed") return s.status === 1
        if (statusFilter === "error") return s.status === 2
        return true
    })

    const counts = {
        all: items.length,
        parsing: items.filter((s) => s.status === 0).length,
        parsed: items.filter((s) => s.status === 1).length,
        error: items.filter((s) => s.status === 2).length,
    }

    return (
        <>
            <Navbar />

            {/* Controlled upload dialog — triggered by the banner's "Upload Now" */}
            <UploadStatementDialog
                open={uploadOpen}
                onOpenChange={setUploadOpen}
                onUploaded={handleUploaded}
            />

            <main className="mx-auto max-w-5xl px-6 py-8 space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Statements</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        All uploaded statements and their parsing status.
                    </p>
                </div>

                {/* Info callout */}
                <div className="flex items-start gap-2.5 rounded-lg border border-blue-500/20 bg-blue-500/5 px-4 py-3 text-sm text-blue-700 dark:text-blue-300">
                    <Info className="h-4 w-4 mt-0.5 shrink-0" />
                    <p>
                        Statement balance may not tally with your dashboard&apos;s monthly spending — statements
                        often include cross-month transactions depending on your billing cycle cut-off date.
                    </p>
                </div>

                {/* Missing cards reminder — only shown when data is loaded */}
                {!loading && allCards.length > 0 && (
                    <MissingCardsBanner
                        allCards={allCards}
                        statements={items}
                        onUploadNow={() => setUploadOpen(true)}
                    />
                )}

                {/* Status filter tabs */}
                <div className="flex gap-1 border-b">
                    {(["all", "parsed", "parsing", "error"] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setStatusFilter(tab)}
                            className={[
                                "px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px",
                                statusFilter === tab
                                    ? "border-foreground text-foreground"
                                    : "border-transparent text-muted-foreground hover:text-foreground",
                            ].join(" ")}
                        >
                            {tab}
                            {counts[tab] > 0 && (
                                <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs font-mono">
                                    {counts[tab]}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Table */}
                <StatementTable
                    statements={filtered}
                    loading={loading}
                    onRetry={handleRetry}
                    onDelete={handleDelete}
                />
            </main>
        </>
    )
}

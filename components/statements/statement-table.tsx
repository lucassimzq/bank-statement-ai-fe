"use client"

import { useState } from "react"
import type { statements } from "@/lib/api"
import { RefreshCw, Trash2, AlertCircle, CheckCircle2, Loader2, ChevronDown, ChevronUp } from "lucide-react"

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
    })
}

function fmtDateTime(iso: string) {
    return new Date(iso).toLocaleString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    })
}

type Group = {
    key: string                             // "2026-05" for sorting, "" for no-period
    label: string                           // "May 2026" or "Pending"
    stmts: statements.StatementWithCards[]
}

function groupByPeriod(all: statements.StatementWithCards[]): Group[] {
    const map = new Map<string, statements.StatementWithCards[]>()

    for (const s of all) {
        const key =
            s.year && s.month
                ? `${s.year}-${String(s.month).padStart(2, "0")}`
                : ""
        if (!map.has(key)) map.set(key, [])
        map.get(key)!.push(s)
    }

    const groups: Group[] = []
    for (const [key, stmts] of map.entries()) {
        const [y, m] = key.split("-")
        const label = key === "" ? "Pending" : `${MONTHS[parseInt(m) - 1]} ${y}`
        // Within each group: uploaded desc
        const sorted = [...stmts].sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        groups.push({ key, label, stmts: sorted })
    }

    // Pending at top, then period desc
    return groups.sort((a, b) => {
        if (a.key === "") return -1
        if (b.key === "") return 1
        return b.key.localeCompare(a.key)
    })
}

// ── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: number }) {
    if (status === 0) {
        return (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-500">
                <Loader2 className="h-3 w-3 animate-spin" />
                Parsing
            </span>
        )
    }
    if (status === 1) {
        return (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-medium text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-3 w-3" />
                Parsed
            </span>
        )
    }
    return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-500">
            <AlertCircle className="h-3 w-3" />
            Error
        </span>
    )
}

function CardChips({ cards }: { cards: statements.CardStatementInfo[] }) {
    if (cards.length === 0) return <span className="text-xs text-muted-foreground">—</span>
    return (
        <div className="flex flex-wrap gap-1">
            {cards.map((c) => (
                <span
                    key={c.card_last4}
                    className={[
                        "inline-flex items-center rounded px-1.5 py-0.5 text-xs font-mono font-medium",
                        c.status === 1
                            ? "bg-green-500/10 text-green-700 dark:text-green-400"
                            : "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
                    ].join(" ")}
                    title={c.status === 1 ? "Parsed" : "Skipped — card not in system"}
                >
                    ···{c.card_last4}
                    {c.status === 2 && <span className="ml-1 opacity-60">⚠</span>}
                </span>
            ))}
        </div>
    )
}

// ── Statement row ─────────────────────────────────────────────────────────────

interface RowProps {
    stmt: statements.StatementWithCards
    onRetry: (id: string) => Promise<void>
    onDelete: (id: string) => Promise<void>
}

function StatementRow({ stmt, onRetry, onDelete }: RowProps) {
    const [expanded, setExpanded] = useState(false)
    const [retrying, setRetrying] = useState(false)
    const [confirmDelete, setConfirmDelete] = useState(false)
    const [deleting, setDeleting] = useState(false)

    const handleRetry = async () => {
        setRetrying(true)
        try {
            await onRetry(stmt.id)
        } finally {
            setRetrying(false)
        }
    }

    const handleDelete = async () => {
        setDeleting(true)
        try {
            await onDelete(stmt.id)
        } finally {
            setDeleting(false)
            setConfirmDelete(false)
        }
    }

    const hasDetail = !!stmt.message || stmt.cards.some((c) => c.status === 2)

    return (
        <>
            <tr className="border-b hover:bg-muted/30 transition-colors">
                {/* Expand toggle — only shown when there's detail to show */}
                <td className="py-3 pl-6 pr-2 w-8">
                    {hasDetail ? (
                        <button
                            onClick={() => setExpanded((v) => !v)}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                            {expanded ? (
                                <ChevronUp className="h-3.5 w-3.5" />
                            ) : (
                                <ChevronDown className="h-3.5 w-3.5" />
                            )}
                        </button>
                    ) : (
                        <span className="block w-3.5" />
                    )}
                </td>

                {/* Status */}
                <td className="py-3 px-3">
                    <StatusBadge status={stmt.status} />
                </td>

                {/* Cards */}
                <td className="py-3 px-3">
                    <CardChips cards={stmt.cards} />
                </td>

                {/* Balance */}
                <td className="py-3 px-3 text-sm text-right tabular-nums">
                    {stmt.statement_bal ? (
                        <span className="font-medium">
                            {parseFloat(stmt.statement_bal).toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                            })}
                        </span>
                    ) : (
                        <span className="text-muted-foreground">—</span>
                    )}
                </td>

                {/* Uploaded at */}
                <td className="py-3 px-3 text-sm text-muted-foreground">
                    {fmtDate(stmt.created_at)}
                </td>

                {/* Parsed at */}
                <td className="py-3 px-3 text-sm text-muted-foreground">
                    {stmt.parsed_at ? fmtDateTime(stmt.parsed_at) : "—"}
                </td>

                {/* Actions — only shown for error statements */}
                <td className="py-3 pl-3 pr-5">
                    {stmt.status === 2 && (
                        <div className="flex items-center justify-end gap-1.5">
                            {/* Retry */}
                            <button
                                onClick={handleRetry}
                                disabled={retrying || deleting}
                                className="inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                            >
                                <RefreshCw className={["h-3 w-3", retrying ? "animate-spin" : ""].join(" ")} />
                                {retrying ? "Retrying…" : "Retry"}
                            </button>

                            {/* Delete with inline confirm */}
                            {confirmDelete ? (
                                <>
                                    <button
                                        onClick={handleDelete}
                                        disabled={deleting}
                                        className="rounded px-2 py-1 text-xs font-medium bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
                                    >
                                        {deleting ? "Deleting…" : "Confirm"}
                                    </button>
                                    <button
                                        onClick={() => setConfirmDelete(false)}
                                        className="rounded px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => setConfirmDelete(true)}
                                    disabled={retrying}
                                    className="rounded p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 disabled:opacity-50 transition-colors"
                                    title="Delete error statement"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>
                    )}
                </td>
            </tr>

            {/* Inline detail (error message / skipped card hint) */}
            {expanded && hasDetail && (
                <tr className="border-b bg-muted/20">
                    <td colSpan={7} className="px-12 py-3 space-y-1.5">
                        {stmt.message && (
                            <div className="flex items-start gap-2 text-red-500">
                                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                                <span className="font-mono text-xs">{stmt.message}</span>
                            </div>
                        )}
                        {stmt.cards.some((c) => c.status === 2) && (
                            <p className="text-xs text-yellow-600 dark:text-yellow-400">
                                ⚠ Some cards were skipped — add them via &quot;Add Card&quot; then retry.
                            </p>
                        )}
                        <p className="text-xs text-muted-foreground font-mono">{stmt.id}</p>
                    </td>
                </tr>
            )}
        </>
    )
}

// ── Period group ──────────────────────────────────────────────────────────────

interface GroupRowsProps {
    group: Group
    onRetry: (id: string) => Promise<void>
    onDelete: (id: string) => Promise<void>
}

function PeriodGroup({ group, onRetry, onDelete }: GroupRowsProps) {
    // "Pending" (no period yet) starts collapsed — avoids stuck items dominating the list
    const [open, setOpen] = useState(group.key !== "")

    // Sum balances of all parsed statements in this group
    const groupTotal = group.stmts.reduce((sum, s) => {
        if (!s.statement_bal) return sum
        const v = parseFloat(s.statement_bal)
        return isNaN(v) ? sum : sum + v
    }, 0)
    const hasTotal = groupTotal > 0

    return (
        <>
            {/* Group header */}
            <tr
                className="bg-muted/40 cursor-pointer select-none hover:bg-muted/60 transition-colors"
                onClick={() => setOpen((v) => !v)}
            >
                <td colSpan={7} className="py-2.5 pl-4 pr-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {open ? (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                                <ChevronUp className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span className="text-sm font-semibold">{group.label}</span>
                            <span className="text-xs text-muted-foreground">
                                {group.stmts.length} {group.stmts.length === 1 ? "statement" : "statements"}
                            </span>
                        </div>
                        {hasTotal && (
                            <span className="text-sm font-semibold tabular-nums">
                                {groupTotal.toLocaleString("en-US", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                })}
                            </span>
                        )}
                    </div>
                </td>
            </tr>

            {/* Statement rows */}
            {open &&
                group.stmts.map((stmt) => (
                    <StatementRow key={stmt.id} stmt={stmt} onRetry={onRetry} onDelete={onDelete} />
                ))}
        </>
    )
}

// ── Main export ───────────────────────────────────────────────────────────────

interface Props {
    statements: statements.StatementWithCards[]
    loading: boolean
    onRetry: (id: string) => Promise<void>
    onDelete: (id: string) => Promise<void>
}

export function StatementTable({ statements, loading, onRetry, onDelete }: Props) {
    if (loading) {
        return (
            <div className="flex items-center justify-center py-20 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Loading statements…
            </div>
        )
    }

    if (statements.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-2 text-muted-foreground">
                <p className="text-sm font-medium">No statements found</p>
                <p className="text-xs">Upload a PDF statement to get started.</p>
            </div>
        )
    }

    const groups = groupByPeriod(statements)

    return (
        <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b bg-muted/50">
                        <th className="py-3 pl-6 pr-2 w-8" />
                        <th className="py-3 px-3 text-left font-medium text-muted-foreground">Status</th>
                        <th className="py-3 px-3 text-left font-medium text-muted-foreground">Cards</th>
                        <th className="py-3 px-3 text-right font-medium text-muted-foreground">Balance</th>
                        <th className="py-3 px-3 text-left font-medium text-muted-foreground">Uploaded at</th>
                        <th className="py-3 px-3 text-left font-medium text-muted-foreground">Parsed at</th>
                        <th className="py-3 pl-3 pr-5 text-right font-medium text-muted-foreground">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {groups.map((group) => (
                        <PeriodGroup key={group.key} group={group} onRetry={onRetry} onDelete={onDelete} />
                    ))}
                </tbody>
            </table>
        </div>
    )
}

"use client"

import Link from "next/link"
import { AddCardDialog } from "@/components/add-card-dialog"
import { UploadStatementDialog } from "@/components/upload-statement-dialog"

interface Props {
    onCardCreated?: () => void
    onStatementUploaded?: () => void
}

export function Navbar({ onCardCreated, onStatementUploaded }: Props) {
    return (
        <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
                <Link href="/" className="font-semibold text-sm tracking-tight">
                    BankAI
                </Link>
                <div className="flex items-center gap-2">
                    <AddCardDialog onCreated={onCardCreated} />
                    <UploadStatementDialog onUploaded={onStatementUploaded} />
                </div>
            </div>
        </header>
    )
}

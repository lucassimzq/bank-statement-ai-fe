"use client"

import Link from "next/link"
import { UploadStatementDialog } from "@/components/upload-statement-dialog"

interface Props {
    onStatementUploaded?: () => void
}

export function Navbar({ onStatementUploaded }: Props) {
    return (
        <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
                <Link href="/" className="font-semibold text-sm tracking-tight">
                    BankAI
                </Link>
                <UploadStatementDialog onUploaded={onStatementUploaded} />
            </div>
        </header>
    )
}

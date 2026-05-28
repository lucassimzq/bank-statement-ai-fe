"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { AddCardDialog } from "@/components/add-card-dialog"
import { UploadStatementDialog } from "@/components/upload-statement-dialog"

interface Props {
    onCardCreated?: () => void
    onStatementUploaded?: () => void
}

export function Navbar({ onCardCreated, onStatementUploaded }: Props) {
    const pathname = usePathname()
    return (
        <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
                <div className="flex items-center gap-6">
                    <Link href="/" className="font-semibold text-sm tracking-tight">
                        BankAI
                    </Link>
                    <nav className="flex items-center gap-4">
                        {[
                            { href: "/", label: "Dashboard" },
                            { href: "/statements", label: "Statements" },
                        ].map(({ href, label }) => (
                            <Link
                                key={href}
                                href={href}
                                className={[
                                    "text-sm transition-colors",
                                    pathname === href
                                        ? "text-foreground font-medium"
                                        : "text-muted-foreground hover:text-foreground",
                                ].join(" ")}
                            >
                                {label}
                            </Link>
                        ))}
                    </nav>
                </div>
                <div className="flex items-center gap-2">
                    <AddCardDialog onCreated={onCardCreated} />
                    <UploadStatementDialog onUploaded={onStatementUploaded} />
                </div>
            </div>
        </header>
    )
}

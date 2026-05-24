"use client"

import { useRef, useState } from "react"
import { Upload } from "lucide-react"
import client from "@/lib/client"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

interface Props {
    onUploaded?: () => void
}

export function UploadStatementDialog({ onUploaded }: Props) {
    const [open, setOpen] = useState(false)
    const [file, setFile] = useState<File | null>(null)
    const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle")
    const [errorMsg, setErrorMsg] = useState("")
    const fileInputRef = useRef<HTMLInputElement>(null)

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
        if (!file) return

        setStatus("uploading")
        setErrorMsg("")

        try {
            const form = new FormData()
            form.append("file", file)

            const res = await client.statements.Upload("POST", form)
            if (!res.ok) {
                const body = await res.json().catch(() => null)
                throw new Error(body?.error ?? `HTTP ${res.status}`)
            }

            setStatus("success")
            onUploaded?.()
            setTimeout(() => handleOpenChange(false), 1200)
        } catch (err) {
            setStatus("error")
            setErrorMsg(err instanceof Error ? err.message : "Upload failed")
        }
    }

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
                    {/* File drop zone */}
                    <div className="space-y-1.5">
                        <Label>PDF Statement</Label>
                        <p className="text-xs text-muted-foreground">
                            Cards, year, and month will be extracted automatically from the statement.
                        </p>
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
                        disabled={!file || status === "uploading"}
                    >
                        {status === "uploading" ? "Uploading…" :
                         status === "success"   ? "Done! Parsing in background…" :
                         "Upload & Parse"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}

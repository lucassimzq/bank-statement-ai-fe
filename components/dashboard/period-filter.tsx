"use client"

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

const YEARS = Array.from({length: 5}, (_, i) => new Date().getFullYear() - i)

interface Props {
    year: number
    month: number
    onYearChange: (y: number) => void
    onMonthChange: (m: number) => void
}

export function PeriodFilter({year, month, onYearChange, onMonthChange}: Props) {
    return (
        <div className="flex items-center gap-2">
            <Select value={String(year)} onValueChange={(v) => onYearChange(Number(v))}>
                <SelectTrigger className="w-28">
                    <SelectValue/>
                </SelectTrigger>
                <SelectContent>
                    {YEARS.map((y) => (
                        <SelectItem key={y} value={String(y)}>
                            {y}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Select value={String(month)} onValueChange={(v) => onMonthChange(Number(v))}>
                <SelectTrigger className="w-36">
                    <SelectValue/>
                </SelectTrigger>
                <SelectContent>
                    {MONTHS.map((name, i) => (
                        <SelectItem key={i + 1} value={String(i + 1)}>
                            {name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    )
}

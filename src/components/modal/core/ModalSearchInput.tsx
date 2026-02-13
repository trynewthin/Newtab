import { cn } from "@/core/utils"
import { Search } from "lucide-react"

export interface ModalSearchInputProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
    className?: string
}

export function ModalSearchInput({
    value,
    onChange,
    placeholder,
    className,
}: ModalSearchInputProps) {
    return (
        <div className={cn(
            "relative group hidden sm:block w-48 lg:w-64 transition-all focus-within:w-64 lg:focus-within:w-80",
            className,
        )}>
            <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-foreground transition-colors"
                size={14}
            />
            <input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full modal-minimal-input pl-9 pr-3"
            />
        </div>
    )
}

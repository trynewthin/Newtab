import type { LucideIcon } from "lucide-react"

export interface AppModalEmptyStateProps {
    icon: LucideIcon
    message: string
}

export function AppModalEmptyState({ icon: Icon, message }: AppModalEmptyStateProps) {
    return (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
            <div className="flex flex-col items-center gap-3 text-muted-foreground/50">
                <Icon size={44} strokeWidth={1.5} className="opacity-40" />
                <span className="text-sm font-medium">{message}</span>
            </div>
        </div>
    )
}

import { cn } from "@/core/utils"
import { Inbox } from "lucide-react"

type IconComponent = React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>

export interface ModalEmptyStateProps {
    icon?: IconComponent
    message: string
    className?: string
}

export function ModalEmptyState({
    icon: Icon = Inbox,
    message,
    className,
}: ModalEmptyStateProps) {
    return (
        <div className={cn(
            "flex flex-col items-center justify-center py-24 text-muted-foreground/60 space-y-3 text-center",
            className,
        )}>
            <Icon size={44} strokeWidth={1.5} className="opacity-40" />
            <span className="text-sm">{message}</span>
        </div>
    )
}

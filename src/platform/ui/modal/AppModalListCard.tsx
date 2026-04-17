import * as React from "react"
import { cn } from "@/shared/utils"

export interface AppModalListCardProps {
    icon?: React.ReactNode
    actions?: React.ReactNode
    children: React.ReactNode
    className?: string
    onClick?: () => void
}

export function AppModalListCard({
    icon,
    actions,
    children,
    className,
    onClick,
}: AppModalListCardProps) {
    return (
        <div
            role={onClick ? "button" : undefined}
            tabIndex={onClick ? 0 : undefined}
            onClick={onClick}
            onKeyDown={onClick ? (event) => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault()
                    onClick()
                }
            } : undefined}
            className={cn(
                "group relative flex items-center gap-3.5 rounded-2xl p-3 transition-all duration-200",
                "shadow-[0_4px_12px_rgba(0,0,0,0.12),0_2px_6px_rgba(0,0,0,0.08)]",
                "dark:shadow-[0_4px_12px_rgba(255,255,255,0.08),0_2px_6px_rgba(255,255,255,0.05)]",
                "hover:shadow-[0_6px_20px_rgba(0,0,0,0.16),0_3px_8px_rgba(0,0,0,0.1)]",
                "dark:hover:shadow-[0_6px_20px_rgba(255,255,255,0.12),0_3px_8px_rgba(255,255,255,0.07)]",
                "hover:scale-[1.01]",
                onClick && "cursor-pointer",
                className,
            )}
        >
            {icon ? (
                <div className="flex shrink-0 items-center justify-center">
                    {icon}
                </div>
            ) : null}
            <div className="min-w-0 flex-1">
                {children}
            </div>
            {actions ? (
                <div className="flex shrink-0 items-center gap-1.5">
                    {actions}
                </div>
            ) : null}
        </div>
    )
}

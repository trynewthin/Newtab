import * as React from "react"
import { cn } from "@/shared/utils"

export interface AppModalV1ListCardProps {
    /** Left icon slot */
    icon?: React.ReactNode
    /** Right actions slot */
    actions?: React.ReactNode
    /** Center content */
    children: React.ReactNode
    className?: string
    onClick?: () => void
}

export function AppModalV1ListCard({ icon, actions, children, className, onClick }: AppModalV1ListCardProps) {
    return (
        <div
            role={onClick ? "button" : undefined}
            tabIndex={onClick ? 0 : undefined}
            onClick={onClick}
            onKeyDown={onClick ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } } : undefined}
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
            {icon && (
                <div className="flex shrink-0 items-center justify-center">
                    {icon}
                </div>
            )}
            <div className="flex-1 min-w-0">
                {children}
            </div>
            {actions && (
                <div className="flex items-center gap-1.5 shrink-0">
                    {actions}
                </div>
            )}
        </div>
    )
}

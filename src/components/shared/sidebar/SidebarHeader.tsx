import * as React from "react"
import { cn } from "@/lib/utils"
import { Menu, X, type LucideIcon } from "lucide-react"
import { useTranslation } from "react-i18next"

export interface SidebarHeaderProps {
    title: React.ReactNode
    icon?: LucideIcon | React.ElementType
    description?: React.ReactNode
    children?: React.ReactNode
    onMenuClick?: () => void
    onClose?: () => void
    className?: string
}

export function SidebarHeader({
    title,
    icon: Icon,
    description,
    children,
    onMenuClick,
    onClose,
    className
}: SidebarHeaderProps) {
    const { t } = useTranslation();

    return (
        <header className={cn(
            "h-14 shrink-0 border-b border-border/40 flex items-center justify-between px-4 md:px-6 bg-background z-20 transition-all",
            className
        )}>
            <div className="flex items-center gap-3 min-w-0 overflow-hidden pr-2">
                {/* Mobile Menu Trigger */}
                {onMenuClick && (
                    <button
                        onClick={onMenuClick}
                        className="md:hidden p-2 rounded-lg hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-all shrink-0"
                        aria-label={t('open_menu')}
                    >
                        <Menu size={20} />
                    </button>
                )}

                <div className="flex items-center gap-3 min-w-0">
                    {/* Icon */}
                    {Icon && (
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shrink-0">
                            <Icon size={18} />
                        </div>
                    )}

                    {/* Title & Description */}
                    <div className="flex flex-col justify-center min-w-0 overflow-hidden">
                        <h2 className="text-sm font-bold leading-tight truncate">{title}</h2>
                        {description && (
                            <p className="text-[10px] text-muted-foreground truncate opacity-60 font-medium">
                                {description}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Actions & Close */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                {children}

                {onClose && (
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-all flex items-center justify-center"
                        title={t('close')}
                    >
                        <X size={18} />
                    </button>
                )}
            </div>
        </header>
    )
}

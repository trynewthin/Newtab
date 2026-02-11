import * as React from "react"
import { cn } from "@/platform/core/utils"
import { type LucideIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { HugeiconsIcon } from "@hugeicons/react"
import { Menu01Icon, Cancel01Icon } from "@hugeicons/core-free-icons"

type SidebarHeaderIconComponent = React.ComponentType<{
    size?: number;
    className?: string;
}>;

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
    const IconComponent = Icon as SidebarHeaderIconComponent | undefined;

    return (
        <header className={cn(
            "z-20 flex h-14 shrink-0 items-center justify-between border-b border-border/60 bg-background/92 px-4 transition-all md:px-6",
            className
        )}>
            <div className="flex items-center gap-3 min-w-0 overflow-hidden pr-2">
                {/* Mobile Menu Trigger */}
                {onMenuClick && (
                    <button
                        onClick={onMenuClick}
                        className="md:hidden p-2 rounded-lg text-muted-foreground hover:bg-foreground/8 hover:text-foreground transition-all shrink-0"
                        aria-label={t('open_menu')}
                    >
                        <HugeiconsIcon icon={Menu01Icon} size={20} strokeWidth={2.5} />
                    </button>
                )}

                <div className="flex items-center gap-3 min-w-0">
                    {/* Icon */}
                    {IconComponent && (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-background text-foreground/80">
                            <IconComponent size={18} />
                        </div>
                    )}

                    {/* Title & Description */}
                    <div className="flex flex-col justify-center min-w-0 overflow-hidden">
                        <h2 className="truncate text-sm font-semibold leading-tight tracking-tight">{title}</h2>
                        {description && (
                            <p className="truncate text-[10px] font-medium text-muted-foreground/80">
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
                        className="group flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-all hover:bg-foreground/8 hover:text-foreground"
                        title={t('close')}
                    >
                        <HugeiconsIcon icon={Cancel01Icon} size={18} strokeWidth={2.5} className="group-hover:scale-110 transition-transform" />
                    </button>
                )}
            </div>
        </header>
    )
}


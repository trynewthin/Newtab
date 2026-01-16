import * as React from "react"
import { cn } from "@/lib/utils"
import { PanelLeftClose, PanelLeftOpen, X, type LucideIcon } from "lucide-react"
import { useTranslation } from "react-i18next"

export interface SidebarProps {
    children?: React.ReactNode
    isCollapsed?: boolean
    onCollapseChange?: (collapsed: boolean) => void
    className?: string
    header?: React.ReactNode
    footer?: React.ReactNode
    // Mobile support
    showMobileMenu?: boolean
    onCloseMobileMenu?: () => void
    title?: string
}

export function Sidebar({
    children,
    isCollapsed = false,
    onCollapseChange,
    className,
    header,
    footer,
    showMobileMenu,
    onCloseMobileMenu,
    title,
}: SidebarProps) {
    const { t } = useTranslation();

    return (
        <aside
            className={cn(
                "flex flex-col h-full bg-secondary/5 border-r border-border/40 transition-all duration-300 ease-in-out shrink-0 relative",
                // Width
                isCollapsed ? "w-16" : "w-[260px]",
                // Mobile absolute positioning
                "absolute md:relative z-50 h-full",
                !showMobileMenu && "-translate-x-full md:translate-x-0",
                showMobileMenu && "translate-x-0 shadow-2xl md:shadow-none bg-background/95 md:bg-transparent w-[280px]",
                className
            )}
        >
            {/* Sidebar Header */}
            <div className={cn(
                "h-14 flex items-center shrink-0 border-b border-border/40 transition-all",
                isCollapsed && !showMobileMenu ? "justify-center px-0" : "justify-between px-4"
            )}>
                {(showMobileMenu || !isCollapsed) && (
                    <div className="flex items-center gap-3">
                        {header || (title && <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground/50">{title}</h2>)}
                    </div>
                )}

                <div className="flex items-center gap-1">
                    {/* Desktop Toggle */}
                    {onCollapseChange && !showMobileMenu && (
                        <button
                            onClick={() => onCollapseChange(!isCollapsed)}
                            className={cn(
                                "hidden md:flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-all",
                                "w-8 h-8",
                                isCollapsed ? "" : "ml-auto"
                            )}
                            title={isCollapsed ? t('expand') : t('collapse')}
                        >
                            {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
                        </button>
                    )}

                    {/* Mobile Close Button */}
                    {showMobileMenu && onCloseMobileMenu && (
                        <button
                            onClick={onCloseMobileMenu}
                            className="p-1.5 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive md:hidden transition-all"
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>
            </div>

            {/* Sidebar Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                {children}
            </div>

            {/* Sidebar Footer */}
            {footer && (
                <div className="p-3 border-t border-border/40 shrink-0">
                    {footer}
                </div>
            )}
        </aside>
    )
}

export interface SidebarItemProps {
    icon: LucideIcon | React.ElementType
    label: string
    isActive?: boolean
    onClick?: () => void
    isCollapsed?: boolean
    className?: string
    actions?: React.ReactNode
    badge?: React.ReactNode
}

export function SidebarItem({
    icon: Icon,
    label,
    isActive,
    onClick,
    isCollapsed,
    className,
    actions,
    badge,
}: SidebarItemProps) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "group relative flex items-center rounded-xl cursor-pointer transition-all w-full",
                isCollapsed ? "justify-center px-0 py-2.5 h-12" : "justify-between px-3 py-2.5 outline-none",
                isActive
                    ? "bg-primary/10 text-primary font-bold shadow-xs"
                    : "hover:bg-secondary/50 text-muted-foreground hover:text-foreground font-medium",
                className
            )}
            title={isCollapsed ? label : undefined}
        >
            <div className={cn(
                "flex items-center min-w-0 transition-all",
                isCollapsed ? "gap-0 justify-center" : "gap-3 pr-2"
            )}>
                <Icon
                    size={isCollapsed ? 20 : 18}
                    className={cn(
                        "shrink-0 transition-opacity",
                        isActive ? "opacity-100" : "opacity-60 group-hover:opacity-100"
                    )}
                />
                {!isCollapsed && (
                    <span className="truncate text-sm tracking-tight text-left flex-1">
                        {label}
                    </span>
                )}
            </div>

            {!isCollapsed && (
                <div className="flex items-center gap-1.5 shrink-0">
                    {badge}
                    {actions && (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            {actions}
                        </div>
                    )}
                </div>
            )}
        </button>
    )
}

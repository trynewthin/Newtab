import * as React from "react"
import { cn } from "@/core/utils"
import { PanelLeftClose, PanelLeftOpen, type LucideIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { HugeiconsIcon } from "@hugeicons/react"
import { Cancel01Icon } from "@hugeicons/core-free-icons"

// 创建 Context 来下发侧边栏状态
interface SidebarContextValue {
    isCollapsed: boolean;
    showMobileMenu: boolean;
}

const SidebarContext = React.createContext<SidebarContextValue | undefined>(undefined);

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
    showMobileMenu = false,
    onCloseMobileMenu,
    title,
}: SidebarProps) {
    const { t } = useTranslation();

    // 内部合并后的状态逻辑：如果是移动端菜单打开，则视为“未折叠”展示全文
    const contextValue = React.useMemo(() => ({
        isCollapsed,
        showMobileMenu
    }), [isCollapsed, showMobileMenu]);

    return (
        <SidebarContext.Provider value={contextValue}>
            <aside
                className={cn(
                    "flex flex-col h-full bg-secondary/5 border-r border-border/40 transition-all duration-300 ease-in-out shrink-0 relative overflow-hidden",
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
                        <div className="flex items-center gap-3 overflow-hidden">
                            {header || (title && <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground/50 truncate">{title}</h2>)}
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
                                <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2.5} size={20} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Sidebar Content */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar p-2 space-y-1">
                    {children}
                </div>

                {/* Sidebar Footer */}
                {footer && (
                    <div className={cn(
                        "border-t border-border/40 shrink-0 overflow-hidden",
                        isCollapsed ? "p-2" : "p-3"
                    )}>
                        {footer}
                    </div>
                )}
            </aside>
        </SidebarContext.Provider>
    )
}

export interface SidebarItemProps {
    icon: LucideIcon | React.ElementType
    label: string
    isActive?: boolean
    onClick?: () => void
    isCollapsed?: boolean // 现在变为可选，优先从 Context 获取
    className?: string
    actions?: React.ReactNode
    badge?: React.ReactNode
}

export function SidebarItem({
    icon: Icon,
    label,
    isActive,
    onClick,
    isCollapsed: propIsCollapsed,
    className,
    actions,
    badge,
}: SidebarItemProps) {
    const context = React.useContext(SidebarContext);

    // 核心逻辑内化：
    // 如果在 Sidebar 内部使用，自动计算：桌面端看折叠状态，移动端菜单打开时强制展示全文
    const effectiveCollapsed = React.useMemo(() => {
        if (propIsCollapsed !== undefined) return propIsCollapsed;
        if (!context) return false;
        return context.isCollapsed && !context.showMobileMenu;
    }, [propIsCollapsed, context]);

    return (
        <button
            onClick={onClick}
            className={cn(
                "group relative flex items-center rounded-xl cursor-pointer transition-all overflow-hidden",
                effectiveCollapsed
                    ? "justify-center w-full h-12"
                    : "justify-between w-full px-3 py-2.5 outline-none",
                isActive
                    ? "bg-primary/10 text-primary font-bold shadow-xs"
                    : "hover:bg-secondary/50 text-muted-foreground hover:text-foreground font-medium",
                className
            )}
            title={effectiveCollapsed ? label : undefined}
        >
            <div className={cn(
                "flex items-center min-w-0 transition-all",
                effectiveCollapsed ? "gap-0 justify-center w-full" : "gap-3 pr-2 flex-1"
            )}>
                <Icon
                    size={effectiveCollapsed ? 20 : 18}
                    className={cn(
                        "shrink-0 transition-opacity",
                        isActive ? "opacity-100" : "opacity-60 group-hover:opacity-100"
                    )}
                />
                {!effectiveCollapsed && (
                    <span className="truncate text-sm tracking-tight text-left flex-1">
                        {label}
                    </span>
                )}
            </div>

            {!effectiveCollapsed && (
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

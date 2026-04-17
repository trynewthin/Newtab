"use client"

import * as React from "react"
import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react"
import { cn } from "@/shared/utils"
import { AppModalV2, type AppModalV2Props } from "./AppModalV2"
import { AppModalV2CloseButton } from "./AppModalV2CloseButton"

export interface AppModalV2SidebarItem {
    id: string
    label: string
    icon?: React.ComponentType<{ size?: number; className?: string }>
    actions?: React.ReactNode
}

export interface AppModalV2SidebarProps extends Omit<AppModalV2Props, "contentLayer" | "floatLayer"> {
    children: React.ReactNode
    sidebarItems: AppModalV2SidebarItem[]
    sidebarActiveId?: string
    onSidebarChange?: (id: string) => void
    sidebarFooter?: React.ReactNode
    floatLayer?: React.ReactNode
    sidebarClassName?: string
    contentClassName?: string
    defaultSidebarCollapsed?: boolean
    closeButtonLabel?: string
}

export function AppModalV2Sidebar({
    open,
    onOpenChange,
    backgroundLayer,
    children,
    sidebarItems,
    sidebarActiveId,
    onSidebarChange,
    sidebarFooter,
    floatLayer,
    className,
    containerClassName,
    backdropClassName,
    sidebarClassName,
    contentClassName,
    defaultSidebarCollapsed = false,
    closeButtonLabel,
}: AppModalV2SidebarProps) {
    const [sidebarCollapsed, setSidebarCollapsed] = React.useState(defaultSidebarCollapsed)
    const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false)

    const handleOpenChange = React.useCallback((nextOpen: boolean) => {
        if (!nextOpen) {
            setMobileSidebarOpen(false)
        }
        onOpenChange(nextOpen)
    }, [onOpenChange])

    const handleSidebarItemSelect = React.useCallback((id: string) => {
        onSidebarChange?.(id)
        setMobileSidebarOpen(false)
    }, [onSidebarChange])

    const renderSidebarItems = React.useCallback((collapsed: boolean) => (
        <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1">
                {sidebarItems.map((item) => {
                    const Icon = item.icon
                    const isActive = sidebarActiveId === item.id

                    return (
                        <button
                            key={item.id}
                            type="button"
                            title={collapsed ? item.label : undefined}
                            onClick={() => handleSidebarItemSelect(item.id)}
                            className={cn(
                                "group/item flex w-full items-center rounded-xl border border-transparent px-2.5 py-2 text-left transition-all duration-200",
                                isActive
                                    ? "bg-foreground text-background shadow-sm"
                                    : "text-foreground/72 hover:bg-foreground/8 hover:text-foreground",
                                collapsed
                                    ? "justify-center"
                                    : "gap-2.5"
                            )}
                        >
                            {Icon ? (
                                <Icon
                                    size={16}
                                    className={cn("shrink-0", isActive ? "text-background" : "text-current")}
                                />
                            ) : null}
                            {!collapsed && (
                                <>
                                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                                        {item.label}
                                    </span>
                                    {item.actions ? (
                                        <span
                                            className="shrink-0"
                                            onClick={(event) => event.stopPropagation()}
                                        >
                                            {item.actions}
                                        </span>
                                    ) : null}
                                </>
                            )}
                        </button>
                    )
                })}
            </div>
            {sidebarFooter ? (
                <div className="mt-3 border-t border-border/70 pt-3">
                    {sidebarFooter}
                </div>
            ) : null}
        </div>
    ), [handleSidebarItemSelect, sidebarActiveId, sidebarFooter, sidebarItems])

    const desktopSidebar = (
        <aside
            className={cn(
                "hidden h-full shrink-0 border-r border-border/70 bg-background/76 backdrop-blur-xl sm:flex sm:flex-col",
                sidebarCollapsed ? "sm:w-[4.75rem]" : "sm:w-[16rem]",
                sidebarClassName,
            )}
        >
            <div className={cn(
                "flex items-center gap-2 border-b border-border/70 p-3",
                sidebarCollapsed && "justify-center"
            )}>
                <AppModalV2CloseButton label={closeButtonLabel} />
                <button
                    type="button"
                    aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                    onClick={() => setSidebarCollapsed((prev) => !prev)}
                    className={cn(
                        "inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/70 bg-background/82 text-foreground/78 backdrop-blur-xl",
                        "shadow-[0_10px_30px_rgba(0,0,0,0.14)] transition-all duration-200",
                        "hover:bg-background/92 hover:text-foreground hover:scale-[1.02]",
                        "active:scale-[0.98]",
                    )}
                >
                    {sidebarCollapsed
                        ? <PanelLeftOpen size={16} strokeWidth={2.5} />
                        : <PanelLeftClose size={16} strokeWidth={2.5} />}
                </button>
            </div>

            <div className="min-h-0 flex-1 p-3">
                {renderSidebarItems(sidebarCollapsed)}
            </div>
        </aside>
    )

    const contentLayer = (
        <div className="flex h-full min-h-0 w-full">
            {desktopSidebar}
            <section className={cn("min-w-0 flex-1", contentClassName)}>
                {children}
            </section>
        </div>
    )

    const combinedFloatLayer = (
        <>
            <div className="absolute left-3 top-3 z-10 sm:hidden">
                <button
                    type="button"
                    aria-label="Open sidebar"
                    onClick={() => setMobileSidebarOpen(true)}
                    className={cn(
                        "pointer-events-auto inline-flex h-9 w-9 items-center justify-center rounded-xl",
                        "border border-border/70 bg-background/82 text-foreground/78 backdrop-blur-xl",
                        "shadow-[0_10px_30px_rgba(0,0,0,0.14)] transition-all duration-200",
                        "hover:bg-background/92 hover:text-foreground hover:scale-[1.02]",
                        "active:scale-[0.98]",
                    )}
                >
                    <Menu size={16} strokeWidth={2.5} />
                </button>
            </div>

            {mobileSidebarOpen ? (
                <div className="absolute inset-0 z-20 sm:hidden">
                    <div
                        className="absolute inset-0 bg-black/18 backdrop-blur-[2px] pointer-events-auto"
                        onClick={() => setMobileSidebarOpen(false)}
                    />

                    <div
                        className={cn(
                            "absolute inset-y-0 left-0 w-[min(18rem,88vw)] border-r border-border/70 bg-background/88 backdrop-blur-2xl",
                            "shadow-[0_30px_80px_rgba(0,0,0,0.22)]"
                        )}
                    >
                        <div className="flex h-full min-h-0 flex-col">
                            <div className="flex items-center gap-2 border-b border-border/70 p-3">
                                <AppModalV2CloseButton label={closeButtonLabel} />
                                <button
                                    type="button"
                                    aria-label="Close sidebar"
                                    onClick={() => setMobileSidebarOpen(false)}
                                    className={cn(
                                        "inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/70 bg-background/82 text-foreground/78 backdrop-blur-xl",
                                        "shadow-[0_10px_30px_rgba(0,0,0,0.14)] transition-all duration-200",
                                        "hover:bg-background/92 hover:text-foreground hover:scale-[1.02]",
                                        "active:scale-[0.98]",
                                    )}
                                >
                                    <PanelLeftClose size={16} strokeWidth={2.5} />
                                </button>
                            </div>

                            <div className="min-h-0 flex-1 p-3">
                                {renderSidebarItems(false)}
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}

            {floatLayer}
        </>
    )

    return (
        <AppModalV2
            open={open}
            onOpenChange={handleOpenChange}
            backgroundLayer={backgroundLayer}
            contentLayer={contentLayer}
            floatLayer={combinedFloatLayer}
            className={className}
            containerClassName={containerClassName}
            backdropClassName={backdropClassName}
        />
    )
}

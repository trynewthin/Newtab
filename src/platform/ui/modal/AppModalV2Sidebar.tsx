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
    sidebarStorageKey?: string
}

const SIDEBAR_SESSION_PREFIX = "app-modal-v2-sidebar:"

function readStoredCollapsedState(storageKey?: string, fallback = false): boolean {
    if (!storageKey || typeof window === "undefined") {
        return fallback
    }

    try {
        const rawValue = window.sessionStorage.getItem(`${SIDEBAR_SESSION_PREFIX}${storageKey}`)
        if (rawValue === "1") return true
        if (rawValue === "0") return false
    } catch {
        return fallback
    }

    return fallback
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
    sidebarStorageKey,
}: AppModalV2SidebarProps) {
    const [sidebarCollapsed, setSidebarCollapsed] = React.useState(() =>
        readStoredCollapsedState(sidebarStorageKey, defaultSidebarCollapsed)
    )
    const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false)

    React.useEffect(() => {
        setSidebarCollapsed(readStoredCollapsedState(sidebarStorageKey, defaultSidebarCollapsed))
    }, [defaultSidebarCollapsed, sidebarStorageKey])

    React.useEffect(() => {
        if (!sidebarStorageKey || typeof window === "undefined") {
            return
        }

        try {
            window.sessionStorage.setItem(
                `${SIDEBAR_SESSION_PREFIX}${sidebarStorageKey}`,
                sidebarCollapsed ? "1" : "0"
            )
        } catch {
            // Ignore storage write failures and keep runtime behavior intact.
        }
    }, [sidebarCollapsed, sidebarStorageKey])

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
                                "group/item flex w-full items-center overflow-hidden border border-transparent px-2.5 py-2 text-left transition-[background-color,color,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                                isActive
                                    ? "bg-foreground text-background shadow-sm"
                                    : "text-foreground/72 hover:bg-foreground/8 hover:text-foreground",
                                collapsed
                                    ? "mx-auto h-10 w-10 rounded-full justify-center px-0 py-0"
                                    : "rounded-xl gap-2.5"
                            )}
                        >
                            {Icon ? (
                                <Icon
                                    size={16}
                                    className={cn("shrink-0", isActive ? "text-background" : "text-current")}
                                />
                            ) : null}
                            <div
                                className={cn(
                                    "flex min-w-0 flex-1 items-center overflow-hidden transition-[max-width,opacity,transform,margin] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                                    collapsed
                                        ? "ml-0 max-w-0 translate-x-[-8px] opacity-0"
                                        : "ml-0 max-w-[14rem] translate-x-0 opacity-100"
                                )}
                            >
                                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                                    {item.label}
                                </span>
                                {item.actions ? (
                                    <span
                                        className="ml-2 shrink-0"
                                        onClick={(event) => event.stopPropagation()}
                                    >
                                        {item.actions}
                                    </span>
                                ) : null}
                            </div>
                        </button>
                    )
                })}
            </div>
            {sidebarFooter ? (
                <div className="mt-3 pt-3">
                    {sidebarFooter}
                </div>
            ) : null}
        </div>
    ), [handleSidebarItemSelect, sidebarActiveId, sidebarFooter, sidebarItems])

    const desktopSidebar = (
        <aside
            className={cn(
                "hidden h-full shrink-0 overflow-hidden bg-foreground/[0.04] backdrop-blur-xl transition-[width,background-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] sm:flex sm:flex-col",
                sidebarCollapsed ? "sm:w-[4.75rem]" : "sm:w-[16rem]",
                sidebarClassName,
            )}
        >
            <div className="px-4 pb-5 pt-4">
                <div className="relative h-9">
                    <div
                        className={cn(
                            "absolute left-0 top-0 transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                            sidebarCollapsed
                                ? "pointer-events-none -translate-x-2 opacity-0"
                                : "translate-x-0 opacity-100"
                        )}
                    >
                    <AppModalV2CloseButton label={closeButtonLabel} />
                    </div>
                    <button
                        type="button"
                        aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                        onClick={() => setSidebarCollapsed((prev) => !prev)}
                        className={cn(
                            "absolute top-0 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/70 bg-background/82 text-foreground/78 backdrop-blur-xl",
                            "shadow-[0_10px_30px_rgba(0,0,0,0.14)] transition-[left,transform,background-color,color,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                            "hover:bg-background/92 hover:text-foreground hover:scale-[1.02]",
                            "active:scale-[0.98]",
                            sidebarCollapsed
                                ? "left-1/2 -translate-x-1/2"
                                : "left-11 translate-x-0"
                        )}
                    >
                        {sidebarCollapsed
                            ? <PanelLeftOpen size={16} strokeWidth={2.5} />
                            : <PanelLeftClose size={16} strokeWidth={2.5} />}
                    </button>
                </div>
            </div>

            <div className="min-h-0 flex-1 px-3 pb-3">
                {renderSidebarItems(sidebarCollapsed)}
            </div>
        </aside>
    )

    const contentLayer = (
        <div className="flex h-full min-h-0 w-full">
            {desktopSidebar}
            <section className={cn("min-w-0 flex-1 bg-background/92", contentClassName)}>
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
                            "absolute inset-y-0 left-0 w-[min(18rem,88vw)] bg-foreground/[0.06] backdrop-blur-2xl",
                            "shadow-[0_30px_80px_rgba(0,0,0,0.22)]"
                        )}
                    >
                        <div className="flex h-full min-h-0 flex-col">
                            <div className="flex items-center gap-2 p-3">
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

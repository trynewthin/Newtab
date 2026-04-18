"use client"

import * as React from "react"
import { ArrowLeft, Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react"
import { AppChromeIconButton } from "@/platform/ui/chrome"
import { GradualBlur } from "@/platform/ui/effects"
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
    sidebarToolbarContent?: React.ReactNode
    headerTitle?: React.ReactNode
    onHeaderBack?: () => void
    headerBackLabel?: string
    headerActions?: React.ReactNode
    headerClassName?: string
    bodyClassName?: string
}

const SIDEBAR_SESSION_PREFIX = "app-modal-v2-sidebar:"
const CONTENT_HEADER_HEIGHT_CLASS = "h-16"

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
    sidebarToolbarContent,
    headerTitle,
    onHeaderBack,
    headerBackLabel = "Back",
    headerActions,
    headerClassName,
    bodyClassName,
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

    const hasContentHeader = headerTitle !== undefined || !!onHeaderBack || headerActions !== undefined

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

    const mobileSidebarTrigger = (
        <AppChromeIconButton
            label="Open sidebar"
            icon={Menu}
            onClick={() => setMobileSidebarOpen(true)}
            className="pointer-events-auto sm:hidden"
        />
    )

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
                    <AppChromeIconButton
                        label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                        icon={sidebarCollapsed ? PanelLeftOpen : PanelLeftClose}
                        onClick={() => setSidebarCollapsed((prev) => !prev)}
                        className={cn(
                            "absolute top-0 transition-[left,transform,background-color,color,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                            sidebarCollapsed
                                ? "left-1/2 -translate-x-1/2"
                                : "left-11 translate-x-0"
                        )}
                    />
                    {sidebarToolbarContent && !sidebarCollapsed ? (
                        <div className="absolute left-11 top-0 translate-x-11">
                            {sidebarToolbarContent}
                        </div>
                    ) : null}
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
            <section className={cn("relative min-w-0 flex-1 bg-background/92", contentClassName)}>
                {hasContentHeader ? (
                    <div className="pointer-events-none absolute inset-x-0 top-0 z-10">
                        <GradualBlur
                            target="parent"
                            preset="header"
                            height="3.75rem"
                            strength={2}
                            divCount={5}
                            curve="bezier"
                            exponential
                            opacity={1}
                            zIndex={0}
                            className="inset-x-0 top-0"
                        />

                        <div
                            className={cn(
                                "relative z-10 flex items-center justify-between px-4 sm:px-6",
                                CONTENT_HEADER_HEIGHT_CLASS,
                                headerClassName,
                            )}
                        >
                            <div className="pointer-events-auto z-10 flex min-w-9 shrink-0 items-center justify-start gap-2">
                                {mobileSidebarTrigger}
                                {onHeaderBack ? (
                                    <AppChromeIconButton
                                        label={headerBackLabel}
                                        icon={ArrowLeft}
                                        onClick={onHeaderBack}
                                        className="border-border/80 bg-background/76 text-foreground/82"
                                    />
                                ) : null}
                            </div>

                            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-16 sm:px-20">
                                <div className="min-w-0 max-w-full truncate text-center text-base font-semibold tracking-[-0.03em] text-foreground/92 sm:text-lg">
                                    {headerTitle}
                                </div>
                            </div>

                            <div className="pointer-events-auto z-10 flex min-w-9 shrink-0 items-center justify-end gap-2">
                                {headerActions}
                            </div>
                        </div>
                    </div>
                ) : null}

                <div
                    className={cn(
                        "h-full min-h-0",
                        hasContentHeader && "pt-16",
                        bodyClassName,
                    )}
                >
                    {children}
                </div>
            </section>
        </div>
    )

    const combinedFloatLayer = (
        <>
            {!hasContentHeader ? (
                <div className="absolute left-3 top-3 z-10 sm:hidden">
                    {mobileSidebarTrigger}
                </div>
            ) : null}

            {mobileSidebarOpen ? (
                <div className="absolute inset-0 z-20 pointer-events-auto sm:hidden">
                    <div
                        className="absolute inset-0 bg-black/18 backdrop-blur-[2px] pointer-events-auto"
                        onClick={() => setMobileSidebarOpen(false)}
                    />

                    <div
                        className={cn(
                            "absolute inset-y-0 left-0 w-[min(18rem,88vw)] pointer-events-auto bg-foreground/[0.06] backdrop-blur-2xl",
                            "shadow-[0_30px_80px_rgba(0,0,0,0.22)]"
                        )}
                    >
                        <div className="flex h-full min-h-0 flex-col">
                            <div className="flex items-center gap-2 p-3">
                                <AppModalV2CloseButton label={closeButtonLabel} />
                                {sidebarToolbarContent}
                                <AppChromeIconButton
                                    label="Close sidebar"
                                    icon={PanelLeftClose}
                                    onClick={() => setMobileSidebarOpen(false)}
                                />
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

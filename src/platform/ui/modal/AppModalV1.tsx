"use client"

import * as React from "react"
import { Dialog } from "@base-ui/react/dialog"
import { cn } from "@/core/utils"
import { LAYER_Z_INDEX } from "@/core/layerZIndex"
import GradualBlur from "@/components/GradualBlur"
import { AppModalV1Header } from "./AppModalV1Header"
import { AppModalV1Sidebar } from "./AppModalV1Sidebar"

// Re-export sub-components for convenience
export { AppModalV1Header } from "./AppModalV1Header"
export { AppModalV1Sidebar } from "./AppModalV1Sidebar"
export { AppModalV1ListCard } from "./AppModalV1ListCard"
export type { AppModalV1ListCardProps } from "./AppModalV1ListCard"
export { AppModalV1EmptyState } from "./AppModalV1EmptyState"
export type { AppModalV1EmptyStateProps } from "./AppModalV1EmptyState"

// ─── Types ───────────────────────────────────────────────────────────

export interface AppModalV1SidebarItem {
    id: string
    icon: React.ComponentType<{ size?: number; className?: string }>
    label: string
    /** Optional actions rendered on the right side of the item */
    actions?: React.ReactNode
}

export interface AppModalV1Props {
    open: boolean
    onOpenChange: (open: boolean) => void
    /** Content rendered inside the floating glass header bar */
    header?: React.ReactNode
    /** Declarative sidebar items. When provided, a toggle button appears in the header. */
    sidebarItems?: AppModalV1SidebarItem[]
    /** Active sidebar item id */
    sidebarActiveId?: string
    /** Called when sidebar item is clicked */
    onSidebarChange?: (id: string) => void
    /** Extra action buttons rendered to the left of the close button */
    headerActions?: React.ReactNode
    /** Footer content rendered below sidebar items */
    sidebarFooter?: React.ReactNode
    /** Float layer content rendered above all other layers. Container is pointer-events-none. */
    floatLayer?: React.ReactNode
    /** Main scrollable content */
    children: React.ReactNode
    /** Additional className on the popup container */
    className?: string
    /** Hide top/bottom blur gradients on scroll area */
    hideBlur?: boolean
}

// ─── Component ───────────────────────────────────────────────────────

export function AppModalV1({
    open,
    onOpenChange,
    header,
    headerActions,
    sidebarItems,
    sidebarActiveId,
    onSidebarChange,
    sidebarFooter,
    floatLayer,
    children,
    className,
    hideBlur,
}: AppModalV1Props) {
    const hasSidebar = sidebarItems && sidebarItems.length > 0
    const [sidebarOpen, setSidebarOpen] = React.useState(false)

    // Close sidebar when modal closes
    React.useEffect(() => {
        if (!open) setSidebarOpen(false)
    }, [open])

    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                {/* ── Backdrop: heavy blur + dark overlay ── */}
                <Dialog.Backdrop
                    style={{ zIndex: LAYER_Z_INDEX.overlayBackdrop }}
                    className={cn(
                        "fixed inset-0 bg-black/45 backdrop-blur-xl",
                        "data-open:animate-in data-closed:animate-out",
                        "data-open:fade-in-0 data-closed:fade-out-0",
                        "duration-300",
                    )}
                />

                {/* ── Popup: scale + fade ── */}
                <Dialog.Popup
                    style={{ zIndex: LAYER_Z_INDEX.overlayContent }}
                    className={cn(
                        "fixed inset-0 outline-none",
                        "sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2",
                        "w-full h-full sm:w-[min(680px,80vw)] sm:h-[min(720px,80vh)]",
                        "sm:max-w-[calc(100vw-2rem)] sm:max-h-[calc(100vh-2rem)]",
                        "data-open:animate-in data-closed:animate-out",
                        "data-open:fade-in-0 data-closed:fade-out-0",
                        "data-open:zoom-in-[0.97] data-closed:zoom-out-[0.97]",
                        "duration-300 ease-out",
                        className,
                    )}
                >
                    {/* ── Glass container ── */}
                    <div
                        className={cn(
                            "modal-minimal-scope relative h-full w-full overflow-hidden isolate",
                            "sm:rounded-2xl",
                            "shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_2px_8px_rgba(0,0,0,0.12),0_12px_40px_rgba(0,0,0,0.24),0_32px_80px_rgba(0,0,0,0.18)]",
                        )}
                    >
                        {/* Background layer */}
                        <div className="absolute inset-0 z-0" style={{ backgroundColor: 'var(--background)' }} />

                        {/* ── Floating glass header bar ── */}
                        {header && (
                            <AppModalV1Header
                                sidebarToggle={hasSidebar ? { open: sidebarOpen, onToggle: () => setSidebarOpen(v => !v) } : undefined}
                                actions={headerActions}
                            >
                                {header}
                            </AppModalV1Header>
                        )}

                        {/* ── Float layer (same level as header) ── */}
                        {floatLayer && (
                            <div className="absolute inset-0 z-30 pointer-events-none">
                                {floatLayer}
                            </div>
                        )}

                        {/* ── Sidebar panel (rendered after float layer so it appears on top) ── */}
                        {hasSidebar && (
                            <AppModalV1Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)}>
                                <div className="flex flex-col h-full">
                                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-0.5">
                                        {sidebarItems.map((item) => {
                                            const Icon = item.icon
                                            const isActive = sidebarActiveId === item.id
                                            return (
                                                <div
                                                    key={item.id}
                                                    role="button"
                                                    tabIndex={0}
                                                    onClick={() => onSidebarChange?.(item.id)}
                                                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSidebarChange?.(item.id); } }}
                                                    className={cn(
                                                        "group/item w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-all duration-200 outline-none cursor-pointer",
                                                        isActive
                                                            ? "bg-foreground/16 text-foreground font-semibold"
                                                            : "text-foreground hover:bg-foreground/12",
                                                    )}
                                                >
                                                    <Icon size={15} className="shrink-0" />
                                                    <span className="text-xs font-medium truncate flex-1">{item.label}</span>
                                                    {item.actions && (
                                                        <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                                                            {item.actions}
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                    {sidebarFooter && (
                                        <div className="shrink-0 pt-2 border-t border-foreground/8 mt-2">
                                            {sidebarFooter}
                                        </div>
                                    )}
                                </div>
                            </AppModalV1Sidebar>
                        )}

                        {/* ── Scroll content ── */}
                        <div className="relative z-10 h-full sm:rounded-2xl overflow-hidden">
                            {!hideBlur && <GradualBlur preset="header" zIndex={20} height="3rem" strength={2} />}
                            {!hideBlur && <GradualBlur preset="footer" zIndex={20} height="2.5rem" strength={1.5} />}
                            <div className="h-full overflow-y-auto custom-scrollbar px-5">
                                {header && <div className="h-16 shrink-0" />}
                                {children}
                                <div className="h-10 shrink-0" />
                            </div>
                        </div>
                    </div>
                </Dialog.Popup>
            </Dialog.Portal>
        </Dialog.Root>
    )
}

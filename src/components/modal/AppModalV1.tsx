"use client"

import * as React from "react"
import { Dialog } from "@base-ui/react/dialog"
import { X, PanelLeftOpen, PanelLeftClose, type LucideIcon } from "lucide-react"
import { cn } from "@/core/utils"
import { LAYER_Z_INDEX } from "@/core/layerZIndex"
import AppSurface from "@/components/surface/AppSurface"
import GradualBlur from "@/components/GradualBlur"

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
    /** Footer rendered at the bottom of the modal (outside scroll area) */
    footer?: React.ReactNode
    /** Main scrollable content */
    children: React.ReactNode
    /** Additional className on the popup container */
    className?: string
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
    footer,
    children,
    className,
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

                        {/* ── Sidebar panel ── */}
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
                        <div className="relative z-10 h-full flex flex-col sm:rounded-2xl overflow-hidden">
                            <div className="relative flex-1 min-h-0">
                                <GradualBlur preset="header" zIndex={20} height="3rem" strength={2} />
                                <GradualBlur preset="footer" zIndex={20} height="2.5rem" strength={1.5} />
                                <div className="h-full overflow-y-auto custom-scrollbar px-5">
                                    {header && <div className="h-16 shrink-0" />}
                                    {children}
                                    <div className="h-10 shrink-0" />
                                </div>
                            </div>
                            {footer && (
                                <div className="relative z-20 shrink-0">
                                    {footer}
                                </div>
                            )}
                        </div>
                    </div>
                </Dialog.Popup>
            </Dialog.Portal>
        </Dialog.Root>
    )
}

// ─── Floating glass header ──────────────────────────────────────────

interface AppModalV1HeaderProps {
    children: React.ReactNode
    sidebarToggle?: { open: boolean; onToggle: () => void }
    actions?: React.ReactNode
}

function AppModalV1Header({ children, sidebarToggle, actions }: AppModalV1HeaderProps) {
    return (
        <div className="absolute inset-x-0 top-0 z-30 pointer-events-none">
            <div className={cn(
                "mx-3 mt-3 relative overflow-hidden rounded-xl pointer-events-auto",
                "shadow-[0_4px_16px_rgba(0,0,0,0.15),0_2px_6px_rgba(0,0,0,0.1)]",
                "dark:shadow-[0_4px_16px_rgba(255,255,255,0.08),0_2px_6px_rgba(255,255,255,0.05)]",
            )}>
                <div className="absolute inset-0 z-0">
                    <AppSurface variant="toolbar" width="100%" height="100%" />
                </div>
                <div className="relative z-10 flex items-center p-2">
                    {sidebarToggle ? (
                        <>
                            {/* Left: sidebar toggle */}
                            <div className="flex items-center shrink-0 z-10">
                                <button
                                    type="button"
                                    onClick={sidebarToggle.onToggle}
                                    className={cn(
                                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full sm:rounded-lg transition-all duration-200",
                                        sidebarToggle.open
                                            ? "bg-foreground text-background shadow-sm"
                                            : "text-muted-foreground hover:text-foreground hover:bg-secondary",
                                    )}
                                >
                                    {sidebarToggle.open
                                        ? <PanelLeftClose size={13} strokeWidth={2.5} />
                                        : <PanelLeftOpen size={13} strokeWidth={2.5} />
                                    }
                                </button>
                            </div>
                            {/* Center: header content (truly centered) */}
                            <div className="absolute inset-0 flex items-center justify-center px-12 pointer-events-none">
                                <div className="pointer-events-auto w-full max-w-md">
                                    {children}
                                </div>
                            </div>
                        </>
                    ) : (
                        /* No sidebar: header content in normal flow, left-aligned */
                        <div className="flex-1 min-w-0">
                            {children}
                        </div>
                    )}
                    {/* Right: actions + close button */}
                    <div className="ml-auto shrink-0 z-10 flex items-center gap-0.5">
                        {actions}
                        <Dialog.Close
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                        >
                            <X size={14} strokeWidth={2.5} />
                        </Dialog.Close>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ─── List card ──────────────────────────────────────────────────────

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

// ─── Empty state ────────────────────────────────────────────────────

export interface AppModalV1EmptyStateProps {
    icon: LucideIcon
    message: string
}

export function AppModalV1EmptyState({ icon: Icon, message }: AppModalV1EmptyStateProps) {
    return (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
            <div className="flex flex-col items-center gap-3 text-muted-foreground/50">
                <Icon size={44} strokeWidth={1.5} className="opacity-40" />
                <span className="text-sm font-medium">{message}</span>
            </div>
        </div>
    )
}

// ─── Sidebar panel ──────────────────────────────────────────────────

interface AppModalV1SidebarProps {
    open: boolean
    onClose: () => void
    children: React.ReactNode
}

function AppModalV1Sidebar({ open, onClose, children }: AppModalV1SidebarProps) {
    return (
        <>
            {/* Backdrop to close sidebar on outside click */}
            {open && (
                <div
                    className="absolute inset-0 z-20"
                    onClick={onClose}
                />
            )}

            {/* Sidebar panel */}
            <div className={cn(
                "absolute top-16 bottom-3 left-3 z-20 w-48",
                open
                    ? ""
                    : "hidden",
            )}>
                <div className={cn(
                    "relative h-full overflow-hidden rounded-2xl",
                    "shadow-[0_4px_16px_rgba(0,0,0,0.15),0_2px_6px_rgba(0,0,0,0.1)]",
                    "dark:shadow-[0_4px_16px_rgba(255,255,255,0.08),0_2px_6px_rgba(255,255,255,0.05)]",
                )}>
                    <div className="absolute inset-0 z-0 rounded-2xl overflow-hidden">
                        <AppSurface variant="toolbar" width="100%" height="100%" borderRadius={16} />
                    </div>
                    <div className="relative z-10 h-full overflow-y-auto custom-scrollbar p-2">
                        {children}
                    </div>
                </div>
            </div>
        </>
    )
}

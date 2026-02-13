"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { cn } from "@/core/utils"
import { HugeiconsIcon } from "@hugeicons/react"
import { Cancel01Icon } from "@hugeicons/core-free-icons"
import { ModalButton } from "@/components/modal/core/ModalButton"
import { useTranslation } from "react-i18next"
import { LAYER_Z_INDEX } from "@/core/layerZIndex"

// ─── Click origin tracking (shared with Modal) ───
let lastClickPos = {
    x: typeof window !== "undefined" ? window.innerWidth / 2 : 0,
    y: typeof window !== "undefined" ? window.innerHeight / 2 : 0,
}
if (typeof window !== "undefined") {
    window.addEventListener(
        "mousedown",
        (e) => { lastClickPos = { x: e.clientX, y: e.clientY } },
        { capture: true, passive: true },
    )
}

// ─── Size presets ───
export type AppPanelSize = "sm" | "md" | "lg"

const SIZE_CLASSES: Record<AppPanelSize, string> = {
    sm: "sm:max-w-[380px]",
    md: "sm:max-w-[480px]",
    lg: "sm:max-w-[600px]",
}

// ─── Props ───
export interface AppPanelProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    size?: AppPanelSize
    children?: React.ReactNode

    // Floating layer — pre-positioned slots
    title?: React.ReactNode
    showCloseButton?: boolean
    headerActions?: React.ReactNode
    footerActions?: React.ReactNode

    // Three layers
    background?: React.ReactNode
    content?: React.ReactNode
    floating?: React.ReactNode

    className?: string
    contentClassName?: string
}

export function AppPanel({
    open,
    onOpenChange,
    size = "md",
    children,
    title,
    showCloseButton = true,
    headerActions,
    footerActions,
    background,
    content,
    floating,
    className,
    contentClassName,
}: AppPanelProps) {
    const { t } = useTranslation()
    const [transformOrigin, setTransformOrigin] = React.useState<string>("center")

    React.useLayoutEffect(() => {
        if (open) {
            const vw = window.innerWidth
            const vh = window.innerHeight
            // Estimate panel center for origin calc
            const pw = Math.min(480, vw)
            const ph = Math.min(vh * 0.7, vh)
            const px = (vw - pw) / 2
            const py = (vh - ph) / 2
            const ox = pw > 0 ? ((lastClickPos.x - px) / pw) * 100 : 50
            const oy = ph > 0 ? ((lastClickPos.y - py) / ph) * 100 : 50
            setTransformOrigin(`${ox}% ${oy}%`)
        }
    }, [open])

    const hasHeader = !!(title || showCloseButton || headerActions)
    const hasFooter = !!footerActions

    return (
        <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
            <DialogPrimitive.Portal>
                {/* Backdrop */}
                <DialogPrimitive.Backdrop
                    style={{ zIndex: LAYER_Z_INDEX.overlayBackdrop }}
                    className="data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 bg-black/24 backdrop-blur-[2px] duration-200 fixed inset-0"
                />

                {/* Panel popup */}
                <DialogPrimitive.Popup
                    style={{ transformOrigin, zIndex: LAYER_Z_INDEX.overlayContent } as React.CSSProperties}
                    className={cn(
                        // Position — mobile full, desktop centered
                        "fixed inset-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2",
                        // Animations
                        "data-open:animate-in data-closed:animate-out",
                        "data-open:fade-in-0 data-closed:fade-out-0",
                        "data-open:zoom-in-95 data-closed:zoom-out-95",
                        "duration-200 ease-out",
                        // Size — mobile full, desktop constrained
                        "w-full sm:w-[90vw]",
                        SIZE_CLASSES[size],
                        "sm:max-h-[80vh]",
                        "outline-none",
                        className,
                    )}
                >
                    <div className="modal-minimal-scope relative w-full h-full sm:h-auto overflow-hidden shadow-2xl ring-1 ring-black/10 sm:rounded-2xl dark:ring-white/10">

                        {/* === Layer 0: Background === */}
                        <div className="absolute inset-0 z-0 pointer-events-none">
                            {background ?? <div className="absolute inset-0 bg-background/95" />}
                        </div>

                        {/* === Layer 1: Content === */}
                        <div className={cn(
                            "relative z-10 flex flex-col",
                            // Mobile: fill screen; Desktop: auto height with max
                            "h-full sm:h-auto sm:max-h-[80vh]",
                        )}>
                            {/* Header — floating layer preset slot */}
                            {hasHeader && (
                                <div className="relative z-20 shrink-0 px-5 pt-5 pb-0">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="min-w-0 flex-1">
                                            {title && (
                                                <DialogPrimitive.Title className="text-base font-semibold tracking-tight text-foreground truncate">
                                                    {title}
                                                </DialogPrimitive.Title>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            {headerActions}
                                            {showCloseButton && (
                                                <DialogPrimitive.Close
                                                    render={
                                                        <ModalButton>
                                                            <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2.5} className="w-4 h-4" />
                                                            <span className="sr-only">{t("close")}</span>
                                                        </ModalButton>
                                                    }
                                                />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Body — scrollable content area */}
                            <div className={cn(
                                "flex-1 min-h-0 overflow-y-auto scrollbar-hide px-5 py-4",
                                contentClassName,
                            )}>
                                {content ?? children}
                            </div>

                            {/* Footer — floating layer preset slot */}
                            {hasFooter && (
                                <div className="relative z-20 shrink-0 px-5 pb-5 pt-2">
                                    <div className="flex items-center justify-end gap-2">
                                        {footerActions}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* === Layer 2: Floating (custom overlay) === */}
                        {floating && (
                            <div className="absolute inset-0 z-30 pointer-events-none">
                                {floating}
                            </div>
                        )}
                    </div>
                </DialogPrimitive.Popup>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    )
}

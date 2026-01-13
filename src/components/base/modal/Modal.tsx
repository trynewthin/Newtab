"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { cn } from "@/lib/utils"
import { HugeiconsIcon } from "@hugeicons/react"
import { Cancel01Icon } from "@hugeicons/core-free-icons"
import { ModalButton } from "./ModalButton"

function ModalRoot({ ...props }: DialogPrimitive.Root.Props) {
    return <DialogPrimitive.Root data-slot="modal" {...props} />
}

function ModalTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
    return <DialogPrimitive.Trigger data-slot="modal-trigger" {...props} />
}

function ModalPortal({ ...props }: DialogPrimitive.Portal.Props) {
    return <DialogPrimitive.Portal data-slot="modal-portal" {...props} />
}

function ModalOverlay({ className, ...props }: DialogPrimitive.Backdrop.Props) {
    return (
        <DialogPrimitive.Backdrop
            data-slot="modal-overlay"
            className={cn(
                "data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 bg-black/40 backdrop-blur-sm duration-100 fixed inset-0 z-[999]",
                className
            )}
            {...props}
        />
    )
}

interface BaseModalProps extends DialogPrimitive.Root.Props {
    // Basic
    trigger?: React.ReactNode
    children?: React.ReactNode
    contentClassName?: string // For the inner content container

    // Layer 1: Header (Floating)
    title?: React.ReactNode
    showTitle?: boolean // default true
    showCloseButton?: boolean // default true
    actions?: React.ReactNode
    header?: React.ReactNode // Full override for header layer
    showGradientShadow?: boolean // Toggle for the top gradient shadow

    // Layer 3: Background
    background?: React.ReactNode // Default is bg-background

    // Layout Options
    scrollable?: boolean // Default true. If false, content area is overflow-hidden and takes full height without padding.

    // NOTE: 'size' prop is intentionally removed from external API to enforce strict uniformity.
    // All modals now use the single standard size defined internally.
}

// THE SINGLE SOURCE OF TRUTH FOR MODAL SIZE
const UNIFIED_SIZE_CLASS = "w-[80vw] h-[80vh]";

function BaseModal({
    children,
    trigger,
    contentClassName,
    // Layer 1 props
    title,
    showTitle = true,
    showCloseButton = true,
    actions,
    header,
    showGradientShadow = true,
    // Layer 3 props
    background,
    // Layout props
    scrollable = true,
    ...props
}: BaseModalProps) {

    return (
        <ModalRoot {...props}>
            {trigger && <ModalTrigger>{trigger}</ModalTrigger>}
            <ModalPortal>
                <ModalOverlay />
                <DialogPrimitive.Popup
                    data-slot="modal-content"
                    className={cn(
                        // Positioning
                        "fixed top-1/2 left-1/2 z-[1000] -translate-x-1/2 -translate-y-1/2 outline-none",
                        // Animations
                        "data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 duration-100",
                        // Base Responsive Limits (Max width/height relative to viewport)
                        "max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)]",
                        // Apply STRICT UNIFIED SIZE
                        UNIFIED_SIZE_CLASS
                    )}
                >
                    {/* 
                        Structure:
                        We have a fixed W/H container (Popup).
                        Inside, we use absolute positioning for layers to fill this fixed container exactly.
                        This guarantees the "Background Layer" is absolutely static and fixed size.
                        Content scrolls strictly within this frame.
                    */}
                    <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 isolate">

                        {/* === Layer 3: Background (Fixed) === */}
                        <div className="absolute inset-0 z-0 pointer-events-none">
                            {background ? background : <div className="absolute inset-0 bg-background/80 backdrop-blur-xl" />}
                        </div>

                        {/* === Layer 2: Content (Scrolls within Fixed Frame) === */}
                        <div className="absolute inset-0 z-10 flex flex-col">
                            <div className={cn(
                                "flex-1 w-full h-full",
                                scrollable ? "overflow-y-auto scrollbar-hide px-6 py-6 pb-20" : "overflow-hidden relative",
                                contentClassName
                            )}>
                                {/* Spacer for Header */}
                                {scrollable && (showTitle || showCloseButton || actions || header) && (
                                    <div className="h-10 w-full shrink-0 mb-1" />
                                )}
                                {children}
                            </div>
                        </div>

                        {/* === Layer 1: Header (Fixed Overlay) === */}
                        <div className="absolute inset-0 z-20 pointer-events-none">
                            {/* Top Gradient */}
                            {showGradientShadow && (
                                <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/5 to-transparent z-[-1]" />
                            )}

                            {header ? (
                                header
                            ) : (
                                <div className="p-4">
                                    <div className="flex items-start justify-between gap-4">
                                        {/* Left: Title */}
                                        <div className="pointer-events-auto min-w-0 flex-1">
                                            {showTitle && title && (
                                                <div className="bg-background/80 backdrop-blur-md border border-border/50 shadow-sm px-4 py-2 rounded-full flex items-center gap-2 max-w-full sm:max-w-fit w-fit">
                                                    <span className="font-semibold text-sm truncate">{title}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Right: Actions + Close */}
                                        <div className="pointer-events-auto flex items-center gap-2 shrink-0">
                                            {actions}
                                            {showCloseButton && (
                                                <DialogPrimitive.Close
                                                    render={
                                                        <ModalButton>
                                                            <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2.5} className="w-4 h-4" />
                                                            <span className="sr-only">Close</span>
                                                        </ModalButton>
                                                    }
                                                />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                    </div>
                </DialogPrimitive.Popup>
            </ModalPortal>
        </ModalRoot>
    )
}

export { BaseModal }

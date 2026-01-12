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
                "data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 bg-black/40 duration-100 fixed inset-0 z-[999]",
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
    className?: string // For the outer modal dimensions/wrapper
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
}

function BaseModal({
    children,
    trigger,
    className,
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
                        // Base positioning and animations
                        "data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 duration-100 fixed top-1/2 left-1/2 z-[1000] -translate-x-1/2 -translate-y-1/2 outline-none",
                        // Layout wrapper
                        "w-full max-w-[calc(100%-2rem)] sm:max-w-[90vw] md:max-w-[80vw] lg:max-w-[70vw] h-[80vh]",
                        className
                    )}
                >
                    {/* Container for the 3 layers */}
                    <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 isolate">

                        {/* === Layer 3: Background === */}
                        <div className="absolute inset-0 z-0 pointer-events-none">
                            {background ? background : <div className="absolute inset-0 bg-background" />}
                        </div>

                        {/* === Layer 2: Content === */}
                        <div className="absolute inset-0 z-10 flex flex-col">
                            {/* 
                                Logic for 'scrollable':
                                - true: uses overflow-y-auto, adds default padding.
                                - false: overflow-hidden (or auto handled by child), no padding.
                            */}
                            <div className={cn(
                                "flex-1 w-full h-full",
                                scrollable ? "overflow-y-auto scrollbar-hide px-6 py-6 pb-20" : "overflow-hidden relative",
                                contentClassName
                            )}>
                                {/* 
                                    Header Spacer Logic:
                                    If we have a floating header (Layer 1), content in Layer 2 starts at top:0.
                                    To avoid content being hidden behind the header initially, we add a spacer.
                                    This spacer is ONLY needed if scrollable is true (so it scrolls away) 
                                    OR if the user hasn't opted out of layout management.
                                */}
                                {scrollable && (showTitle || showCloseButton || actions || header) && (
                                    <div className="h-10 w-full shrink-0 mb-4" />
                                )}
                                {children}
                            </div>
                        </div>

                        {/* === Layer 1: Header (Floating) === */}
                        <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none">
                            {/* Top Gradient Shadow (Decor) */}
                            {showGradientShadow && (
                                <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/5 to-transparent z-[-1]" />
                            )}

                            <div className="p-4">
                                {header ? (
                                    <div className="pointer-events-auto">{header}</div>
                                ) : (
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
                                )}
                            </div>
                        </div>

                    </div>
                </DialogPrimitive.Popup>
            </ModalPortal>
        </ModalRoot>
    )
}

export { BaseModal }

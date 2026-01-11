"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import { Cancel01Icon } from "@hugeicons/core-free-icons"

// --- Modal Internal Components (Based on Dialog.tsx) ---

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
            className={cn("data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 bg-black/40 duration-100 fixed inset-0 z-[999]", className)}
            {...props}
        />
    )
}

function ModalContent({
    className,
    children,
    showCloseButton = true,
    ...props
}: DialogPrimitive.Popup.Props & {
    showCloseButton?: boolean
}) {
    return (
        <ModalPortal>
            <ModalOverlay />
            <DialogPrimitive.Popup
                data-slot="modal-content"
                className={cn(
                    // Base styles from dialog.tsx
                    "bg-background data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 ring-foreground/10 grid rounded-xl shadow-lg ring-1 duration-100 fixed top-1/2 left-1/2 z-[1000] -translate-x-1/2 -translate-y-1/2 outline-none",
                    // Custom layout for Modal (flex column, no padding by default to handle full-width content/headers)
                    "flex flex-col p-0 overflow-hidden",
                    // Responsive sizing (can be overridden by prop)
                    "w-full max-w-[calc(100%-2rem)] sm:max-w-sm",
                    className
                )}
                {...props}
            >
                {children}
                {showCloseButton && (
                    <DialogPrimitive.Close
                        data-slot="modal-close"
                        render={
                            <Button
                                variant="ghost"
                                className="absolute top-2 right-2 z-50 text-muted-foreground hover:text-foreground"
                                size="icon-sm"
                            />
                        }
                    >
                        <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
                        <span className="sr-only">Close</span>
                    </DialogPrimitive.Close>
                )}
            </DialogPrimitive.Popup>
        </ModalPortal>
    )
}

// --- Main Modal Component ---

interface ModalProps extends DialogPrimitive.Root.Props {
    children: React.ReactNode;
    trigger?: React.ReactNode;
    className?: string; // ClassName for the Content
    header?: React.ReactNode;
    title?: React.ReactNode; // Simple title, if no complex header needed
}

export function Modal({ children, trigger, className, title, header, ...props }: ModalProps) {
    return (
        <ModalRoot {...props}>
            {trigger && <ModalTrigger>{trigger}</ModalTrigger>}
            <ModalContent
                className={cn(
                    // Default large size for our "Modal" generic use case
                    "sm:max-w-[90vw] md:max-w-[80vw] lg:max-w-[70vw] h-[80vh]",
                    className
                )}
            >
                {/* 1. Header Area */}
                {/* Simple Title */}
                {title && !header && (
                    <div className="px-6 py-3 border-b border-border/50 shrink-0 flex items-center justify-between">
                        <div className="text-lg font-medium">{title}</div>
                    </div>
                )}

                {/* Custom Header (Fixed) */}
                {header && (
                    <div className="shrink-0 z-10 bg-background/50 backdrop-blur-sm relative">
                        {header}
                    </div>
                )}

                {/* 2. Scrollable Content Area */}
                <div className="flex-1 overflow-auto scrollbar-hide relative z-0">
                    <div className="min-h-full">
                        {children}
                    </div>
                </div>
            </ModalContent>
        </ModalRoot>
    )
}

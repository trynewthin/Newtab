"use client"

import * as React from "react"
import { Dialog } from "@base-ui/react/dialog"
import { PORTAL_LAYER_Z_INDEX } from "@/shared/constants/layerZIndex"
import { cn } from "@/shared/utils"

export interface AppDialogV1Props {
    open: boolean
    onOpenChange: (open: boolean) => void
    children: React.ReactNode
    className?: string
    backdropClassName?: string
    popupClassName?: string
    contentClassName?: string
}

export function AppDialogV1({
    open,
    onOpenChange,
    children,
    className,
    backdropClassName,
    popupClassName,
    contentClassName,
}: AppDialogV1Props) {
    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Backdrop
                    forceRender
                    style={{ zIndex: PORTAL_LAYER_Z_INDEX.dialogBackdrop }}
                    className={cn(
                        "fixed inset-0 bg-black/24 backdrop-blur-[2px]",
                        "data-open:animate-in data-open:fade-in-0",
                        "data-closed:animate-out data-closed:fade-out-0",
                        "duration-200",
                        backdropClassName,
                    )}
                />

                <Dialog.Popup
                    style={{ zIndex: PORTAL_LAYER_Z_INDEX.dialogContent }}
                    className={cn(
                        "fixed left-1/2 top-1/2 w-[min(92vw,42rem)] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-hidden outline-none",
                        "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-[0.98]",
                        "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-[0.98]",
                        "duration-200 ease-out",
                        popupClassName,
                    )}
                >
                    <div
                        className={cn(
                            "modal-minimal-scope relative isolate flex max-h-[min(88vh,48rem)] max-w-full flex-col overflow-hidden rounded-[1.25rem]",
                            "border border-border/70 bg-background shadow-none",
                            className,
                        )}
                    >
                        <div className={cn("relative min-h-0 flex-1", contentClassName)}>{children}</div>
                    </div>
                </Dialog.Popup>
            </Dialog.Portal>
        </Dialog.Root>
    )
}

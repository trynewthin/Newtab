"use client"

import * as React from "react"
import { Dialog } from "@base-ui/react/dialog"
import { cn } from "@/shared/utils"
import { LAYER_Z_INDEX } from "@/shared/constants/layerZIndex"

export interface AppModalV2Props {
    open: boolean
    onOpenChange: (open: boolean) => void
    backgroundLayer?: React.ReactNode
    contentLayer?: React.ReactNode
    floatLayer?: React.ReactNode
    className?: string
    containerClassName?: string
    backdropClassName?: string
}

export function AppModalV2({
    open,
    onOpenChange,
    backgroundLayer,
    contentLayer,
    floatLayer,
    className,
    containerClassName,
    backdropClassName,
}: AppModalV2Props) {
    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Backdrop
                    style={{ zIndex: LAYER_Z_INDEX.overlayBackdrop }}
                    className={cn(
                        "fixed inset-0 bg-black/45 backdrop-blur-xl",
                        "data-open:animate-in data-closed:animate-out",
                        "data-open:fade-in-0 data-closed:fade-out-0",
                        "duration-300",
                        backdropClassName,
                    )}
                />

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
                    <div
                        className={cn(
                            "modal-minimal-scope relative h-full w-full overflow-hidden isolate",
                            "sm:rounded-2xl",
                            "shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_2px_8px_rgba(0,0,0,0.12),0_12px_40px_rgba(0,0,0,0.24),0_32px_80px_rgba(0,0,0,0.18)]",
                            containerClassName,
                        )}
                        style={{
                            backgroundColor: "var(--background)",
                            WebkitMaskImage: "-webkit-radial-gradient(white, black)",
                        }}
                    >
                        {backgroundLayer && (
                            <div className="absolute inset-0 z-0 pointer-events-none">
                                {backgroundLayer}
                            </div>
                        )}

                        {contentLayer && (
                            <div className="relative z-10 h-full w-full">
                                {contentLayer}
                            </div>
                        )}

                        {floatLayer && (
                            <div className="absolute inset-0 z-20 pointer-events-none">
                                {floatLayer}
                            </div>
                        )}
                    </div>
                </Dialog.Popup>
            </Dialog.Portal>
        </Dialog.Root>
    )
}

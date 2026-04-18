"use client"

import * as React from "react"
import { Dialog } from "@base-ui/react/dialog"
import { cn } from "@/shared/utils"
import { MODAL_LAYER_Z_INDEX } from "@/shared/constants/layerZIndex"

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
    const [hasClosedSinceMount, setHasClosedSinceMount] = React.useState(!open)

    React.useEffect(() => {
        if (!open) {
            setHasClosedSinceMount(true)
        }
    }, [open])

    const animateOpen = hasClosedSinceMount || !open

    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Backdrop
                    style={{ zIndex: MODAL_LAYER_Z_INDEX.backdrop }}
                    className={cn(
                        "fixed inset-0 bg-black/45 backdrop-blur-xl",
                        animateOpen && "data-open:animate-in data-open:fade-in-0",
                        "data-closed:animate-out data-closed:fade-out-0",
                        "duration-300",
                        backdropClassName,
                    )}
                />

                <Dialog.Popup
                    style={{ zIndex: MODAL_LAYER_Z_INDEX.shell }}
                    className={cn(
                        "fixed inset-0 outline-none",
                        animateOpen && "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-[0.97]",
                        "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-[0.97]",
                        "duration-300 ease-out",
                        className,
                    )}
                >
                    <div
                        className={cn(
                            "modal-minimal-scope relative h-full w-full overflow-hidden isolate",
                            "rounded-none shadow-none",
                            containerClassName,
                        )}
                        style={{
                            backgroundColor: "var(--background)",
                            WebkitMaskImage: "-webkit-radial-gradient(white, black)",
                        }}
                    >
                        {backgroundLayer && (
                            <div className="absolute inset-0 pointer-events-none" style={{ zIndex: MODAL_LAYER_Z_INDEX.backgroundLayer }}>
                                {backgroundLayer}
                            </div>
                        )}

                        {contentLayer && (
                            <div className="relative h-full w-full" style={{ zIndex: MODAL_LAYER_Z_INDEX.contentLayer }}>
                                {contentLayer}
                            </div>
                        )}

                        {floatLayer && (
                            <div className="absolute inset-0 pointer-events-none" style={{ zIndex: MODAL_LAYER_Z_INDEX.floatLayer }}>
                                {floatLayer}
                            </div>
                        )}
                    </div>
                </Dialog.Popup>
            </Dialog.Portal>
        </Dialog.Root>
    )
}

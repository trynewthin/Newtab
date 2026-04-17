"use client"

import { cn } from "@/shared/utils"
import { LAYER_Z_INDEX } from "@/shared/constants/layerZIndex"

export interface AppModalLoadingFallbackProps {
    fullscreen?: boolean
    className?: string
    containerClassName?: string
    backdropClassName?: string
}

export function AppModalLoadingFallback({
    fullscreen = true,
    className,
    containerClassName,
    backdropClassName,
}: AppModalLoadingFallbackProps) {
    return (
        <>
            <div
                aria-hidden="true"
                style={{ zIndex: LAYER_Z_INDEX.overlayBackdrop }}
                className={cn(
                    "fixed inset-0 bg-black/45 backdrop-blur-xl",
                    backdropClassName,
                )}
            />

            <div
                aria-hidden="true"
                style={{ zIndex: LAYER_Z_INDEX.overlayContent }}
                className={cn(
                    "fixed inset-0 outline-none",
                    !fullscreen && [
                        "sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2",
                        "w-full h-full sm:w-[min(680px,80vw)] sm:h-[min(720px,80vh)]",
                        "sm:max-w-[calc(100vw-2rem)] sm:max-h-[calc(100vh-2rem)]",
                    ],
                    className,
                )}
            >
                <div
                    className={cn(
                        "modal-minimal-scope relative h-full w-full overflow-hidden isolate",
                        fullscreen ? "rounded-none shadow-none" : [
                            "sm:rounded-2xl",
                            "shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_2px_8px_rgba(0,0,0,0.12),0_12px_40px_rgba(0,0,0,0.24),0_32px_80px_rgba(0,0,0,0.18)]",
                        ],
                        containerClassName,
                    )}
                    style={{
                        backgroundColor: "var(--background)",
                        WebkitMaskImage: "-webkit-radial-gradient(white, black)",
                    }}
                />
            </div>
        </>
    )
}

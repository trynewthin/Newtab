import * as React from "react"
import { cn } from "@/core/utils"
import AppSurface from "@/components/surface/AppSurface"

export interface AppModalV1SidebarProps {
    open: boolean
    onClose: () => void
    children: React.ReactNode
}

export function AppModalV1Sidebar({ open, onClose, children }: AppModalV1SidebarProps) {
    return (
        <>
            {/* Backdrop to close sidebar on outside click */}
            {open && (
                <div
                    className="absolute inset-0 z-30"
                    onClick={onClose}
                />
            )}

            {/* Sidebar panel */}
            <div className={cn(
                "absolute top-16 bottom-3 left-3 z-30 w-48",
                open
                    ? ""
                    : "hidden",
            )}>
                <div className={cn(
                    "relative h-full overflow-hidden rounded-2xl",
                    "shadow-[0_4px_16px_rgba(0,0,0,0.15),0_2px_6px_rgba(0,0,0,0.1)]",
                    "dark:shadow-[0_4px_16px_rgba(255,255,255,0.08),0_2px_6px_rgba(255,255,255,0.05)]",
                )}>
                    <div className="absolute inset-0 z-0">
                        <AppSurface variant="toolbar" width="100%" height="100%" />
                    </div>
                    <div className="relative z-10 h-full overflow-y-auto custom-scrollbar p-2">
                        {children}
                    </div>
                </div>
            </div>
        </>
    )
}

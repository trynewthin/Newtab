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
                <div className="relative h-full">
                    {/* Material layer (self-contained: owns borderRadius + shadow) */}
                    <div className="absolute inset-0 z-0">
                        <AppSurface variant="toolbar" />
                    </div>
                    {/* Content layer (clips content to match material corners) */}
                    <div className="relative z-10 h-full overflow-hidden rounded-[28px]">
                        <div className="h-full overflow-y-auto custom-scrollbar p-2">
                            {children}
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

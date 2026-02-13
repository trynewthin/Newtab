import * as React from "react"
import { Dialog } from "@base-ui/react/dialog"
import { X, PanelLeftOpen, PanelLeftClose } from "lucide-react"
import { cn } from "@/core/utils"
import AppSurface from "@/components/surface/AppSurface"

export interface AppModalV1HeaderProps {
    children: React.ReactNode
    sidebarToggle?: { open: boolean; onToggle: () => void }
    actions?: React.ReactNode
}

export function AppModalV1Header({ children, sidebarToggle, actions }: AppModalV1HeaderProps) {
    return (
        <div className="absolute inset-x-0 top-0 z-30 pointer-events-none">
            <div className={cn(
                "mx-3 mt-3 relative overflow-hidden rounded-xl pointer-events-auto",
                "shadow-[0_4px_16px_rgba(0,0,0,0.15),0_2px_6px_rgba(0,0,0,0.1)]",
                "dark:shadow-[0_4px_16px_rgba(255,255,255,0.08),0_2px_6px_rgba(255,255,255,0.05)]",
            )}>
                <div className="absolute inset-0 z-0">
                    <AppSurface variant="toolbar" width="100%" height="100%" />
                </div>
                <div className="relative z-10 flex items-center p-2">
                    {sidebarToggle ? (
                        <>
                            {/* Left: sidebar toggle */}
                            <div className="flex items-center shrink-0 z-10">
                                <button
                                    type="button"
                                    onClick={sidebarToggle.onToggle}
                                    className={cn(
                                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full sm:rounded-lg transition-all duration-200",
                                        sidebarToggle.open
                                            ? "bg-foreground text-background shadow-sm"
                                            : "text-muted-foreground hover:text-foreground hover:bg-secondary",
                                    )}
                                >
                                    {sidebarToggle.open
                                        ? <PanelLeftClose size={13} strokeWidth={2.5} />
                                        : <PanelLeftOpen size={13} strokeWidth={2.5} />
                                    }
                                </button>
                            </div>
                            {/* Center: header content (truly centered) */}
                            <div className="absolute inset-0 flex items-center justify-center px-12 pointer-events-none">
                                <div className="pointer-events-auto w-full max-w-md">
                                    {children}
                                </div>
                            </div>
                        </>
                    ) : (
                        /* No sidebar: header content in normal flow, left-aligned */
                        <div className="flex-1 min-w-0">
                            {children}
                        </div>
                    )}
                    {/* Right: actions + close button */}
                    <div className="ml-auto shrink-0 z-10 flex items-center gap-0.5">
                        {actions}
                        <Dialog.Close
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                        >
                            <X size={14} strokeWidth={2.5} />
                        </Dialog.Close>
                    </div>
                </div>
            </div>
        </div>
    )
}

"use client"

import * as React from "react"
import { cn } from "@/core/utils"
import { SidebarModal } from "./Modal"

/**
 * AppModal - High-level abstraction for App-like dialogs with a Sidebar, Header, and Footer.
 * 
 * This component strictly enforces the 'Settings Page' layout pattern:
 * - Solid background (bg-background)
 * - Collapsible sidebar with mobile drawer support
 * - Fixed header zone
 * - Main content area (scrollable)
 * - Optional fixed footer zone
 * - Automatic mobile overlay handling
 */
interface AppModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    sidebar: React.ReactNode
    isCollapsed?: boolean
    showMobileMenu?: boolean
    onCloseMobileMenu?: () => void
    header?: React.ReactNode
    footer?: React.ReactNode
    children: React.ReactNode
    className?: string
}

export function AppModal({
    open,
    onOpenChange,
    sidebar,
    isCollapsed = false,
    showMobileMenu = false,
    onCloseMobileMenu,
    header,
    footer,
    children,
    className,
}: AppModalProps) {
    return (
        <SidebarModal
            open={open}
            onOpenChange={onOpenChange}
            sidebar={sidebar}
            isCollapsed={isCollapsed}
            contentClassName="bg-background"
        >
            {/* Mobile Overlay - Automatically handled */}
            {showMobileMenu && onCloseMobileMenu && (
                <div
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-200"
                    onClick={onCloseMobileMenu}
                />
            )}

            <div className={cn("flex-1 flex flex-col h-full relative overflow-hidden bg-background", className)}>
                {/* Header Zone */}
                {header && (
                    <div className="relative z-20 shrink-0">
                        {header}
                    </div>
                )}

                {/* Main Content Zone */}
                <div className="flex-1 relative z-10 overflow-hidden">
                    {children}
                </div>

                {/* Footer Zone */}
                {footer && (
                    <div className="relative z-20 shrink-0">
                        {footer}
                    </div>
                )}
            </div>
        </SidebarModal>
    )
}

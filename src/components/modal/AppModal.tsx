"use client"

import * as React from "react"
import { cn } from "@/core/utils"
import { AppSurfaceModal } from "./AppSurfaceModal"

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
        <AppSurfaceModal
            open={open}
            onOpenChange={onOpenChange}
            preset="sidebar"
            sidebar={sidebar}
            sidebarCollapsed={isCollapsed}
            header={header}
            footer={footer}
            background={<div className="absolute inset-0 bg-background" />}
            floating={
                showMobileMenu && onCloseMobileMenu ? (
                    <div
                        className="absolute inset-0 z-20 md:hidden"
                        onClick={onCloseMobileMenu}
                    />
                ) : null
            }
            content={(
                <div className={cn("flex h-full flex-1 flex-col overflow-hidden bg-background", className)}>
                    <div className="relative z-10 flex-1 overflow-hidden">
                        {children}
                    </div>
                </div>
            )}
        />
    )
}

import type { ReactNode } from "react"
import { AppPanel, type AppPanelSize } from "./AppPanel"
import AppSurface from "@/platform/shared/components/surface/AppSurface"
import type { AppSurfaceTone } from "@/platform/core/surfaceMaterials"

export interface AppSurfacePanelProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    size?: AppPanelSize
    tone?: AppSurfaceTone

    // Floating layer slots
    title?: ReactNode
    showCloseButton?: boolean
    headerActions?: ReactNode
    footerActions?: ReactNode

    // Content
    content?: ReactNode
    floating?: ReactNode
    children?: ReactNode

    className?: string
    contentClassName?: string
}

export function AppSurfacePanel({
    open,
    onOpenChange,
    size = "md",
    tone,
    title,
    showCloseButton = true,
    headerActions,
    footerActions,
    content,
    floating,
    children,
    className,
    contentClassName,
}: AppSurfacePanelProps) {
    return (
        <AppPanel
            open={open}
            onOpenChange={onOpenChange}
            size={size}
            title={title}
            showCloseButton={showCloseButton}
            headerActions={headerActions}
            footerActions={footerActions}
            content={content}
            floating={floating}
            className={className}
            contentClassName={contentClassName}
            background={
                <AppSurface
                    variant="base"
                    tone={tone}
                    className="absolute inset-0"
                    width="100%"
                    height="100%"
                />
            }
        >
            {children}
        </AppPanel>
    )
}

import type { ReactNode } from "react";
import {
    AppSurfaceScaffold,
    type AppSurfaceScaffoldPreset,
} from "@/platform/shared/components/surface/AppSurfaceScaffold";
import { cn } from "@/platform/core/utils";

interface AppSurfacePanelProps {
    preset?: AppSurfaceScaffoldPreset;
    title?: ReactNode;
    onClose?: () => void;
    actions?: ReactNode;
    background?: ReactNode;
    content?: ReactNode;
    floating?: ReactNode;
    sidebar?: ReactNode;
    header?: ReactNode;
    footer?: ReactNode;
    sidebarCollapsed?: boolean;
    className?: string;
}

export function AppSurfacePanel({
    preset = "semi",
    title,
    onClose,
    actions,
    background,
    content,
    floating,
    sidebar,
    header,
    footer,
    sidebarCollapsed = false,
    className,
}: AppSurfacePanelProps) {
    return (
        <AppSurfaceScaffold
            preset={preset}
            className={cn("h-screen w-screen font-sans", className)}
            title={title}
            onClose={onClose}
            actions={actions}
            background={background}
            content={content}
            floating={floating}
            sidebar={sidebar}
            header={header}
            footer={footer}
            sidebarCollapsed={sidebarCollapsed}
        />
    );
}


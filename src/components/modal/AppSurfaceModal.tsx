import type { ReactNode } from "react";
import { BaseModal } from "./core/Modal";
import {
    AppSurfaceScaffold,
    type AppSurfaceScaffoldPreset,
} from "@/components/surface/layout/AppSurfaceScaffold";

interface AppSurfaceModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
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

export function AppSurfaceModal({
    open,
    onOpenChange,
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
}: AppSurfaceModalProps) {
    const close = onClose ?? (() => onOpenChange(false));

    return (
        <BaseModal
            open={open}
            onOpenChange={onOpenChange}
            showTitle={false}
            showCloseButton={false}
            showGradientShadow={false}
            scrollable={false}
            contentClassName="p-0 overflow-hidden"
            background={<div className="absolute inset-0 bg-background" />}
        >
            <AppSurfaceScaffold
                preset={preset}
                className={className}
                title={title}
                onClose={close}
                actions={actions}
                background={background}
                content={content}
                floating={floating}
                sidebar={sidebar}
                header={header}
                footer={footer}
                sidebarCollapsed={sidebarCollapsed}
            />
        </BaseModal>
    );
}

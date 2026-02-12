import type { ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/platform/core/utils";
import { AppLayerShell } from "./AppLayerShell";
import { useTranslation } from "react-i18next";

export type AppSurfaceScaffoldPreset = "free" | "semi" | "sidebar";

interface AppSurfaceScaffoldProps {
    preset: AppSurfaceScaffoldPreset;
    className?: string;
    background?: ReactNode;
    content?: ReactNode;
    floating?: ReactNode;
    title?: ReactNode;
    onClose?: () => void;
    actions?: ReactNode;
    sidebar?: ReactNode;
    header?: ReactNode;
    footer?: ReactNode;
    sidebarCollapsed?: boolean;
}

function SemiFloatingHeader({
    title,
    onClose,
    actions,
}: {
    title?: ReactNode;
    onClose?: () => void;
    actions?: ReactNode;
}) {
    const { t } = useTranslation();

    return (
        <div className="absolute inset-x-0 top-0 z-30 pointer-events-none p-4">
            <div className="flex items-start justify-between gap-3">
                <div className="pointer-events-auto min-w-0">
                    {title ? (
                        <div className="max-w-[70vw] truncate rounded-2xl border border-border/70 bg-background/90 px-3 py-1.5 text-sm font-semibold tracking-tight text-foreground shadow-sm">
                            {title}
                        </div>
                    ) : null}
                </div>

                <div className="pointer-events-auto flex items-center gap-2">
                    {actions}
                    {onClose ? (
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/70 bg-background/90 text-foreground/80 shadow-sm transition-all hover:bg-background"
                            aria-label={t("close")}
                        >
                            <X size={16} />
                        </button>
                    ) : null}
                </div>
            </div>
        </div>
    );
}

export function AppSurfaceScaffold({
    preset,
    className,
    background,
    content,
    floating,
    title,
    onClose,
    actions,
    sidebar,
    header,
    footer,
    sidebarCollapsed = false,
}: AppSurfaceScaffoldProps) {
    if (preset === "free") {
        return (
            <AppLayerShell
                className={className}
                background={background}
                content={content}
                floating={floating}
            />
        );
    }

    if (preset === "semi") {
        return (
            <AppLayerShell
                className={className}
                background={background}
                content={
                    <div className="h-full w-full pt-14">
                        {content}
                    </div>
                }
                floating={
                    <>
                        <SemiFloatingHeader title={title} onClose={onClose} actions={actions} />
                        {floating}
                    </>
                }
            />
        );
    }

    return (
        <AppLayerShell
            className={className}
            background={background}
            content={
                <div className={cn(
                    "flex h-full min-w-0 flex-col transition-all duration-300 ease-in-out",
                    sidebarCollapsed ? "md:pl-16" : "md:pl-[260px]"
                )}>
                    {header ? (
                        <div className="relative z-20 shrink-0">
                            {header}
                        </div>
                    ) : null}

                    <div className="relative z-10 min-h-0 flex-1">
                        {content}
                    </div>

                    {footer ? (
                        <div className="relative z-20 shrink-0">
                            {footer}
                        </div>
                    ) : null}
                </div>
            }
            floating={
                <>
                    {sidebar ? (
                        <div className="absolute inset-y-0 left-0 z-30 h-full pointer-events-auto">
                            {sidebar}
                        </div>
                    ) : null}
                    {floating}
                </>
            }
        />
    );
}

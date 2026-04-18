import { useTranslation } from "react-i18next";
import { AppSurface } from "@/platform/ui";
import { cn } from "@/shared/utils";
import type { WidgetRenderProps } from "@/shared/types";

export interface WidgetFoundationProps {
    className?: string;
    background?: React.ReactNode;
    backgroundClassName?: string;
    contentClassName?: string;
    children?: React.ReactNode;
    onActivate?: (event?: React.MouseEvent) => void;
}

export function WidgetBackgroundLayer({
    className,
    children,
}: {
    className?: string;
    children?: React.ReactNode;
}) {
    return (
        <div className={cn("absolute inset-0", className)}>
            {children}
        </div>
    );
}

export function WidgetContentLayer({
    className,
    children,
}: {
    className?: string;
    children?: React.ReactNode;
}) {
    return (
        <div className={cn("relative z-10 h-full w-full", className)}>
            {children}
        </div>
    );
}

export function WidgetFoundationFrame({
    className,
    background,
    backgroundClassName,
    contentClassName,
    children,
    onActivate,
}: WidgetFoundationProps) {
    return (
        <div
            role="button"
            tabIndex={0}
            onClick={(event) => onActivate?.(event)}
            onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onActivate?.();
                }
            }}
            className={cn(
                "group h-full w-full cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                className
            )}
        >
            <AppSurface variant="widget" className="h-full w-full">
                <div className="relative h-full w-full overflow-hidden">
                    <WidgetBackgroundLayer className={backgroundClassName}>
                        {background}
                    </WidgetBackgroundLayer>
                    <WidgetContentLayer className={contentClassName}>
                        {children}
                    </WidgetContentLayer>
                </div>
            </AppSurface>
        </div>
    );
}

export function WidgetFoundation1x1(props: WidgetFoundationProps) {
    return <WidgetFoundationFrame {...props} />;
}

export function WidgetFoundation2x1(props: WidgetFoundationProps) {
    return <WidgetFoundationFrame {...props} />;
}

export function WidgetFoundation1x2(props: WidgetFoundationProps) {
    return <WidgetFoundationFrame {...props} />;
}

export function WidgetFoundation2x2(props: WidgetFoundationProps) {
    return <WidgetFoundationFrame {...props} />;
}

export function WidgetFoundation2x4(props: WidgetFoundationProps) {
    return <WidgetFoundationFrame {...props} />;
}

export function WidgetFoundation4x2(props: WidgetFoundationProps) {
    return <WidgetFoundationFrame {...props} />;
}

export function WidgetUnavailableRenderer({
    item,
    className,
    onActivate,
}: WidgetRenderProps) {
    const { t } = useTranslation();

    return (
        <WidgetFoundation2x2
            className={className}
            onActivate={onActivate}
            background={(
                <div className="h-full w-full bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.14),transparent_60%)]" />
            )}
            contentClassName="flex h-full flex-col justify-end p-4"
        >
            <div className="space-y-1 text-gray-900/92 dark:text-white/92">
                <div className="text-sm font-semibold">{t(item.title)}</div>
                <div className="text-xs text-gray-900/64 dark:text-white/64">
                    {t("widget_generic")}
                </div>
            </div>
        </WidgetFoundation2x2>
    );
}

import { useTranslation } from "react-i18next";
import { cn } from "@/shared/utils";
import AppSurface from "@/platform/ui/surface/AppSurface";
import { renderSystemIcon } from "@/launcher/ui/icons/systemIcons";
import type { LauncherWidgetItem } from "@/launcher/model/itemTypes";
import type { WidgetRenderProps } from "@/shared/types";

function resolveLocalizedTitle(
    t: (key: string, options?: Record<string, unknown>) => string,
    title: string
): string {
    if (title.startsWith("sys_") || title.startsWith("widget_")) {
        return t(title);
    }
    return title;
}

export function WidgetGlassPanel({
    className,
    children,
}: {
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <AppSurface variant="widget" className="h-full w-full">
            <div className={cn("h-full w-full", className)}>{children}</div>
        </AppSurface>
    );
}

export function WidgetCardFrame({
    item,
    className,
    onActivate,
    children,
}: {
    item: Pick<LauncherWidgetItem, "title" | "icon">;
    className?: string;
    onActivate?: (event?: React.MouseEvent) => void;
    children: React.ReactNode;
}) {
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
            <WidgetGlassPanel className="p-3">
                <div className="flex h-full w-full flex-col justify-between">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-900/95 dark:text-white/95">
                        {renderSystemIcon(item.icon || "", "h-4 w-4")}
                    </div>
                    {children}
                </div>
            </WidgetGlassPanel>
        </div>
    );
}

export function AppShortcutWidgetRenderer({
    item,
    className,
    onActivate,
}: WidgetRenderProps) {
    const { t } = useTranslation();
    const displayTitle = resolveLocalizedTitle(t, item.title);

    return (
        <WidgetCardFrame item={item} className={className} onActivate={onActivate}>
            <div className="space-y-1">
                <div className="line-clamp-1 text-sm font-semibold text-gray-900/95 dark:text-white/95">
                    {displayTitle}
                </div>
                <div className="text-xs text-gray-900/72 dark:text-white/72">
                    {t("open_app")}
                </div>
            </div>
        </WidgetCardFrame>
    );
}

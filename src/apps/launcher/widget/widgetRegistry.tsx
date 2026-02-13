import { cn } from "@/core/utils";
import type { LauncherWidgetItem } from "@/state/core/itemTypes";
import { ItemActionMenu } from "@/apps/launcher/components/ItemActionMenu";
import { useTranslation } from "react-i18next";
import AppSurface from "@/components/surface/AppSurface";
import {
    type LauncherTilePreset,
    type LauncherTileVariant,
    type SystemAppId,
    isSystemAppId,
} from "@/apps/launcher/system/appManifest";
import { renderSystemIcon } from "@/apps/launcher/system/systemIcons";
import {
    ClockRenderer,
    DateRenderer,
    SecondsRenderer,
    WeekdayRenderer,
    DayProgressRenderer,
    WeekProgressRenderer,
} from "./timeWidgets";

// ─── Public types ────────────────────────────────────────────────────

export interface WidgetRenderProps {
    item: LauncherWidgetItem;
    preset: LauncherTilePreset;
    gridSize: { w: number; h: number };
    className?: string;
    onActivate?: (event?: React.MouseEvent) => void;
}

export type WidgetResizeAxis = "both" | "horizontal" | "vertical";

export interface WidgetResizeRange {
    minW: number;
    maxW: number;
    minH: number;
    maxH: number;
    axis?: WidgetResizeAxis;
}

export interface SystemWidgetManifestItem {
    id: string;
    title: string;
    icon: string;
    ownerAppId?: SystemAppId;
    launchAppId?: SystemAppId;
    collection?: string;
    variant: LauncherTileVariant;
    draggable: boolean;
    resizable: boolean;
    defaultPreset: LauncherTilePreset;
    supportedPresets: readonly LauncherTilePreset[];
    resizeRange?: WidgetResizeRange;
    renderer: React.ComponentType<WidgetRenderProps>;
}

// ─── Shared helpers ──────────────────────────────────────────────────

function resolveLocalizedTitle(
    t: (key: string, options?: Record<string, unknown>) => string,
    title: string
): string {
    if (title.startsWith("sys_") || title.startsWith("widget_")) {
        return t(title);
    }
    return title;
}

// ─── Generic widget shells ───────────────────────────────────────────

function WidgetGlassPanel({
    className,
    children,
}: {
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <AppSurface variant="widget" className="h-full w-full">
            <div className={cn("h-full w-full", className)}>
                {children}
            </div>
        </AppSurface>
    );
}

function WidgetCardFrame({
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
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg text-white/95">
                        {renderSystemIcon(item.icon || "", "h-4 w-4")}
                    </div>
                    {children}
                </div>
            </WidgetGlassPanel>
        </div>
    );
}

// ─── App shortcut widget (generic fallback) ──────────────────────────

function AppShortcutWidgetRenderer({ item, className, onActivate }: WidgetRenderProps) {
    const { t } = useTranslation();
    const displayTitle = resolveLocalizedTitle(t, item.title);

    return (
        <WidgetCardFrame item={item} className={className} onActivate={onActivate}>
            <div className="space-y-1">
                <div className="line-clamp-1 text-sm font-semibold text-white/95">
                    {displayTitle}
                </div>
                <div className="text-xs text-white/72">
                    {t("open_app")}
                </div>
            </div>
        </WidgetCardFrame>
    );
}

// ─── Widget manifest ─────────────────────────────────────────────────

export const SYSTEM_WIDGET_MANIFEST = [
    {
        id: "clock",
        title: "widget_clock",
        icon: "Timer",
        collection: "time",
        variant: "panel",
        draggable: true,
        resizable: false,
        defaultPreset: "1x1",
        supportedPresets: ["1x1"],
        renderer: ClockRenderer,
    },
    {
        id: "date",
        title: "widget_date",
        icon: "Calendar",
        collection: "time",
        variant: "panel",
        draggable: true,
        resizable: false,
        defaultPreset: "1x1",
        supportedPresets: ["1x1"],
        renderer: DateRenderer,
    },
    {
        id: "seconds",
        title: "widget_seconds",
        icon: "Clock",
        collection: "time",
        variant: "panel",
        draggable: true,
        resizable: false,
        defaultPreset: "1x1",
        supportedPresets: ["1x1"],
        renderer: SecondsRenderer,
    },
    {
        id: "weekday",
        title: "widget_weekday",
        icon: "CalendarDays",
        collection: "time",
        variant: "panel",
        draggable: true,
        resizable: false,
        defaultPreset: "1x1",
        supportedPresets: ["1x1"],
        renderer: WeekdayRenderer,
    },
    {
        id: "day-progress",
        title: "widget_day_progress",
        icon: "Sun",
        collection: "time",
        variant: "panel",
        draggable: true,
        resizable: false,
        defaultPreset: "2x1",
        supportedPresets: ["2x1", "1x2"],
        renderer: DayProgressRenderer,
    },
    {
        id: "week-progress",
        title: "widget_week_progress",
        icon: "CalendarRange",
        collection: "time",
        variant: "panel",
        draggable: true,
        resizable: false,
        defaultPreset: "2x1",
        supportedPresets: ["2x1", "1x2"],
        renderer: WeekProgressRenderer,
    },
    {
        id: "ai-assistant-panel",
        title: "widget_ai_assistant_panel",
        icon: "Sparkles",
        ownerAppId: "ai",
        launchAppId: "ai",
        variant: "panel",
        draggable: true,
        resizable: false,
        defaultPreset: "2x2",
        supportedPresets: ["2x1", "1x2", "2x2", "2x4"],
        renderer: AppShortcutWidgetRenderer,
    },
] as const satisfies readonly SystemWidgetManifestItem[];

// ─── Manifest utilities ──────────────────────────────────────────────

type WidgetManifestItem = (typeof SYSTEM_WIDGET_MANIFEST)[number];
export type SystemWidgetId = WidgetManifestItem["id"];

export function isSystemWidgetId(value: string): value is SystemWidgetId {
    return (SYSTEM_WIDGET_MANIFEST as readonly SystemWidgetManifestItem[]).some((entry) => entry.id === value);
}

export function getWidgetManifestItem(widgetId: string): SystemWidgetManifestItem | null {
    return (SYSTEM_WIDGET_MANIFEST as readonly SystemWidgetManifestItem[]).find((entry) => entry.id === widgetId) ?? null;
}

export function getWidgetsByOwnerApp(appId: SystemAppId): readonly SystemWidgetManifestItem[] {
    return (SYSTEM_WIDGET_MANIFEST as readonly SystemWidgetManifestItem[]).filter((entry) => entry.ownerAppId === appId);
}

export function getWidgetsByCollection(collection: string): readonly SystemWidgetManifestItem[] {
    return (SYSTEM_WIDGET_MANIFEST as readonly SystemWidgetManifestItem[]).filter((entry) => (entry as SystemWidgetManifestItem).collection === collection);
}

export function getWidgetCollections(): string[] {
    const set = new Set<string>();
    for (const entry of SYSTEM_WIDGET_MANIFEST) {
        const col = (entry as SystemWidgetManifestItem).collection;
        if (col) set.add(col);
    }
    return [...set];
}

export function resolveLegacyWidgetId(appId: string): SystemWidgetId | null {
    if (!isSystemAppId(appId)) return null;
    switch (appId) {
        case "ai":
            return "ai-assistant-panel";
        default:
            return null;
    }
}

export function resolveWidgetLaunchAppId(widgetId: string, ownerAppId?: string): SystemAppId | null {
    const item = getWidgetManifestItem(widgetId);
    if (item) {
        if (item.launchAppId) return item.launchAppId;
        if (item.ownerAppId) return item.ownerAppId;
    }

    if (ownerAppId && isSystemAppId(ownerAppId)) {
        return ownerAppId;
    }

    return null;
}

// ─── Launcher widget component ──────────────────────────────────────

interface LauncherWidgetItemProps {
    item: LauncherWidgetItem;
    preset: LauncherTilePreset;
    gridSize: { w: number; h: number };
    className?: string;
    onActivate?: (event?: React.MouseEvent) => void;
    onEdit?: (item: LauncherWidgetItem) => void;
    onDeletePrompt?: (item: LauncherWidgetItem) => void;
    isOverlay?: boolean;
}

export function LauncherWidgetItem({
    item,
    preset,
    gridSize,
    className,
    onActivate,
    onEdit,
    onDeletePrompt,
    isOverlay,
}: LauncherWidgetItemProps) {
    const { t } = useTranslation();
    const widget = getWidgetManifestItem(item.widgetId);
    const Renderer = widget?.renderer ?? AppShortcutWidgetRenderer;

    const handleEdit = () => {
        onEdit?.(item);
    };

    const handleDelete = () => {
        onDeletePrompt?.(item);
    };

    if (!widget) {
        return (
            <div className={cn("group relative h-full w-full", className)}>
                <ItemActionMenu
                    disabled={!!isOverlay}
                    onEdit={() => onEdit?.(item)}
                    onDelete={() => onDeletePrompt?.(item)}
                    editLabel={t("edit")}
                    deleteLabel={t("remove")}
                >
                    <Renderer
                        item={item}
                        preset={preset}
                        gridSize={gridSize}
                        className="h-full w-full"
                        onActivate={onActivate}
                    />
                </ItemActionMenu>
            </div>
        );
    }

    return (
        <div className={cn("group relative h-full w-full", className)}>
            <ItemActionMenu
                disabled={!!isOverlay}
                onEdit={handleEdit}
                onDelete={handleDelete}
                editLabel={t("edit")}
                deleteLabel={t("remove")}
            >
                <Renderer
                    item={item}
                    preset={preset}
                    gridSize={gridSize}
                    className="h-full w-full"
                    onActivate={onActivate}
                />
            </ItemActionMenu>
        </div>
    );
}

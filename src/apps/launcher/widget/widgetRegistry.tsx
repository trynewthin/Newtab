import { useEffect, useRef, useState } from "react";
import { cn } from "@/platform/core/utils";
import type { LauncherWidgetItem } from "@/platform/state/core/itemTypes";
import { ItemActionMenu } from "@/apps/launcher/base/ItemActionMenu";
import { useTranslation } from "react-i18next";
import AppSurface from "@/components/AppSurface";
import {
    type LauncherTilePreset,
    type LauncherTileVariant,
    type SystemAppId,
    isSystemAppId,
} from "@/apps/launcher/system/appManifest";
import { renderSystemIcon } from "@/apps/launcher/system/systemIcons";

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
    variant: LauncherTileVariant;
    draggable: boolean;
    resizable: boolean;
    defaultPreset: LauncherTilePreset;
    supportedPresets: readonly LauncherTilePreset[];
    resizeRange?: WidgetResizeRange;
    renderer: React.ComponentType<WidgetRenderProps>;
}

function resolveLocalizedTitle(
    t: (key: string, options?: Record<string, unknown>) => string,
    title: string
): string {
    if (title.startsWith("sys_") || title.startsWith("widget_")) {
        return t(title);
    }
    return title;
}

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

function formatClockDate(now: Date): string {
    return now.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        weekday: "short",
    });
}

function formatClockDetailDate(now: Date): string {
    return now.toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}

function getClockParts(now: Date) {
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");

    const secondsInDay = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    const dayProgress = secondsInDay / 86400;

    const weekDay = (now.getDay() + 6) % 7; // Monday = 0
    const weekProgress = (weekDay + dayProgress) / 7;

    return {
        hours,
        minutes,
        timeHM: `${hours}:${minutes}`,
        seconds,
        dateShort: formatClockDate(now),
        dateLong: formatClockDetailDate(now),
        weekdayLong: now.toLocaleDateString(undefined, { weekday: "long" }),
        dayProgress,
        weekProgress,
    };
}

function ProgressBar({
    label,
    value,
    compact = false,
}: {
    label: string;
    value: number;
    compact?: boolean;
}) {
    const clamped = Math.max(0, Math.min(1, value));
    const percent = Math.round(clamped * 100);

    return (
        <div className={cn("space-y-1", compact && "space-y-0.5")}>
            <div className={cn("flex items-center justify-between text-white/72", compact ? "text-[9px]" : "text-[10px]")}>
                <span>{label}</span>
                <span>{percent}%</span>
            </div>
            <div className={cn("w-full rounded-full bg-white/20", compact ? "h-1.5" : "h-2")}>
                <div
                    className="h-full rounded-full bg-white/90 transition-[width] duration-300 ease-out"
                    style={{ width: `${percent}%` }}
                />
            </div>
        </div>
    );
}

type ClockScale = "sm" | "md" | "lg";
type ClockBlockKind =
    | "time-hero"
    | "time-single"
    | "time-hour"
    | "time-minute"
    | "date"
    | "date-detail"
    | "weekday"
    | "seconds"
    | "day-progress"
    | "week-progress";

interface ClockBlockPlacement {
    key: string;
    kind: ClockBlockKind;
    x: number;
    y: number;
    w: number;
    h: number;
}

interface ClockGridPlan {
    scale: ClockScale;
    blocks: ClockBlockPlacement[];
}

interface ClockBlockRule {
    kind: ClockBlockKind;
    w: number;
    h: number;
    weight: number;
    minArea: number;
    minCols?: number;
    minRows?: number;
    preferBottom?: boolean;
}

function resolveClockScale(width: number, height: number): ClockScale {
    const area = width * height;
    if (area <= 2) return "sm";
    if (area <= 8) return "md";
    return "lg";
}

function buildClockGridPlan(width: number, height: number): ClockGridPlan {
    const cols = Math.max(1, width);
    const rows = Math.max(1, height);
    const area = cols * rows;
    const occupied = Array.from({ length: rows }, () => Array.from({ length: cols }, () => false));
    const blocks: ClockBlockPlacement[] = [];

    const canPlace = (x: number, y: number, w: number, h: number) => {
        if (x + w > cols || y + h > rows) return false;
        for (let row = y; row < y + h; row += 1) {
            for (let col = x; col < x + w; col += 1) {
                if (occupied[row]?.[col]) return false;
            }
        }
        return true;
    };

    const placeAt = (kind: ClockBlockKind, x: number, y: number, w: number, h: number) => {
        if (!canPlace(x, y, w, h)) return false;
        for (let row = y; row < y + h; row += 1) {
            for (let col = x; col < x + w; col += 1) {
                occupied[row][col] = true;
            }
        }
        blocks.push({
            key: `${kind}-${blocks.length}`,
            kind,
            x,
            y,
            w,
            h,
        });
        return true;
    };

    const placeFirstFit = (
        kind: ClockBlockKind,
        w: number,
        h: number,
        preferBottom = false
    ) => {
        const rowStart = preferBottom ? rows - h : 0;
        const rowEnd = preferBottom ? -1 : rows - h + 1;
        const rowStep = preferBottom ? -1 : 1;
        for (let row = rowStart; row !== rowEnd; row += rowStep) {
            for (let col = 0; col <= cols - w; col += 1) {
                if (placeAt(kind, col, row, w, h)) return true;
            }
        }
        return false;
    };

    const isRuleEligible = (rule: ClockBlockRule) => {
        if (area < rule.minArea) return false;
        if (rule.minCols !== undefined && cols < rule.minCols) return false;
        if (rule.minRows !== undefined && rows < rule.minRows) return false;
        return true;
    };

    const placeRule = (rule: ClockBlockRule) => {
        if (!isRuleEligible(rule)) return false;
        return placeFirstFit(rule.kind, rule.w, rule.h, rule.preferBottom);
    };

    if (cols === 1 && rows === 1) {
        placeAt("time-single", 0, 0, 1, 1);
        return {
            scale: resolveClockScale(cols, rows),
            blocks,
        };
    }

    // 面积门槛 + 权重机制：高权重块只有达标后才会参与布局。
    const primaryHeroRule: ClockBlockRule = {
        kind: "time-hero",
        w: 2,
        h: 2,
        weight: 100,
        minArea: 8,
        minCols: 2,
        minRows: 2,
    };

    const placedHero = placeRule(primaryHeroRule);
    if (!placedHero) {
        if (cols >= 2) {
            placeAt("time-hour", 0, 0, 1, 1);
            placeAt("time-minute", 1, 0, 1, 1);
        } else {
            placeAt("time-hour", 0, 0, 1, 1);
            if (rows >= 2) {
                placeAt("time-minute", 0, 1, 1, 1);
            }
        }
    }

    const weightedRules: ClockBlockRule[] = [
        {
            kind: "seconds",
            w: 1,
            h: 1,
            weight: 78,
            minArea: 4,
            minCols: 2,
        },
        {
            kind: "date",
            w: 1,
            h: 1,
            weight: 72,
            minArea: 3,
        },
        {
            kind: "weekday",
            w: 1,
            h: 1,
            weight: 68,
            minArea: 4,
        },
        {
            kind: "date-detail",
            w: 2,
            h: 1,
            weight: 64,
            minArea: 8,
            minCols: 3,
            minRows: 2,
            preferBottom: true,
        },
        {
            kind: "day-progress",
            w: 2,
            h: 1,
            weight: 60,
            minArea: 6,
            minCols: 2,
            minRows: 2,
            preferBottom: true,
        },
        {
            kind: "week-progress",
            w: 2,
            h: 1,
            weight: 56,
            minArea: 8,
            minCols: 2,
            minRows: 2,
            preferBottom: true,
        },
    ];

    weightedRules
        .sort((a, b) => b.weight - a.weight)
        .forEach((rule) => {
            placeRule(rule);
        });

    return {
        scale: resolveClockScale(cols, rows),
        blocks,
    };
}

function ClockUnitTile({
    className,
    children,
}: {
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <div className={cn("h-full w-full rounded-xl bg-white/10 px-2 py-1.5", className)}>
            {children}
        </div>
    );
}

function ClockWidgetShell({
    className,
    onActivate,
    children,
}: {
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
            <WidgetGlassPanel className="p-3 text-left">
                {children}
            </WidgetGlassPanel>
        </div>
    );
}

function ClockWidgetRenderer({ gridSize, className, onActivate }: WidgetRenderProps) {
    const { t } = useTranslation();
    const [now, setNow] = useState(() => new Date());
    const viewportRef = useRef<HTMLDivElement | null>(null);
    const [canvasLayout, setCanvasLayout] = useState({
        width: 0,
        height: 0,
        columnGap: 0,
        rowGap: 0,
    });

    useEffect(() => {
        const timer = window.setInterval(() => {
            setNow(new Date());
        }, 1000);
        return () => window.clearInterval(timer);
    }, []);

    const parts = getClockParts(now);
    const width = Math.max(1, Math.round(gridSize.w));
    const height = Math.max(1, Math.round(gridSize.h));
    const plan = buildClockGridPlan(width, height);
    const labelClass = plan.scale === "sm" ? "text-[9px]" : plan.scale === "lg" ? "text-[11px]" : "text-[10px]";
    const valueClass = plan.scale === "sm" ? "text-[1.15rem]" : plan.scale === "lg" ? "text-[1.8rem]" : "text-[1.45rem]";
    const heroValueClass = plan.scale === "sm" ? "text-[1.45rem]" : plan.scale === "lg" ? "text-[2.45rem]" : "text-[2.05rem]";
    const compactValueClass = plan.scale === "sm" ? "text-[0.95rem]" : plan.scale === "lg" ? "text-[1.2rem]" : "text-[1.05rem]";
    const baseGapPx = plan.scale === "sm" ? 6 : plan.scale === "lg" ? 10 : 8;
    const edgeInsetPx = plan.scale === "sm" ? 3 : 4;

    useEffect(() => {
        const el = viewportRef.current;
        if (!el) return;

        const compute = () => {
            if (!viewportRef.current) return;
            const availableWidth = viewportRef.current.clientWidth;
            const availableHeight = viewportRef.current.clientHeight;
            if (availableWidth <= 0 || availableHeight <= 0) return;

            const innerWidth = Math.max(1, availableWidth - edgeInsetPx * 2);
            const innerHeight = Math.max(1, availableHeight - edgeInsetPx * 2);
            const minGapWidth = width > 1 ? baseGapPx * (width - 1) : 0;
            const minGapHeight = height > 1 ? baseGapPx * (height - 1) : 0;
            const unit = Math.max(
                1,
                Math.min(
                    (innerWidth - minGapWidth) / width,
                    (innerHeight - minGapHeight) / height
                )
            );

            const usedWidth = unit * width + minGapWidth;
            const usedHeight = unit * height + minGapHeight;
            const remainingWidth = Math.max(0, innerWidth - usedWidth);
            const remainingHeight = Math.max(0, innerHeight - usedHeight);

            const dynamicColumnGap = width > 1
                ? baseGapPx + remainingWidth / (width - 1)
                : 0;
            const dynamicRowGap = height > 1
                ? baseGapPx + remainingHeight / (height - 1)
                : 0;

            const nextWidth = unit * width + dynamicColumnGap * Math.max(0, width - 1);
            const nextHeight = unit * height + dynamicRowGap * Math.max(0, height - 1);

            const precision = 1000;
            const roundedWidth = Math.round(nextWidth * precision) / precision;
            const roundedHeight = Math.round(nextHeight * precision) / precision;
            const roundedColGap = Math.round(dynamicColumnGap * precision) / precision;
            const roundedRowGap = Math.round(dynamicRowGap * precision) / precision;

            setCanvasLayout((prev) => (
                prev.width === roundedWidth &&
                prev.height === roundedHeight &&
                prev.columnGap === roundedColGap &&
                prev.rowGap === roundedRowGap
                    ? prev
                    : {
                        width: roundedWidth,
                        height: roundedHeight,
                        columnGap: roundedColGap,
                        rowGap: roundedRowGap,
                    }
            ));
        };

        compute();
        if (typeof ResizeObserver === "undefined") return;
        const ro = new ResizeObserver(compute);
        ro.observe(el);
        return () => ro.disconnect();
    }, [baseGapPx, edgeInsetPx, width, height]);

    return (
        <ClockWidgetShell className={className} onActivate={onActivate}>
            <div ref={viewportRef} className="flex h-full w-full items-center justify-center">
                <div
                    className="grid"
                    style={{
                        width: canvasLayout.width > 0 ? canvasLayout.width : "100%",
                        height: canvasLayout.height > 0 ? canvasLayout.height : "100%",
                        columnGap: `${canvasLayout.columnGap}px`,
                        rowGap: `${canvasLayout.rowGap}px`,
                        gridTemplateColumns: `repeat(${width}, minmax(0, 1fr))`,
                        gridTemplateRows: `repeat(${height}, minmax(0, 1fr))`,
                    }}
                >
                    {plan.blocks.map((block) => (
                        <div
                            key={`${block.key}-slot`}
                            style={{
                                gridColumn: `${block.x + 1} / span ${block.w}`,
                                gridRow: `${block.y + 1} / span ${block.h}`,
                            }}
                        >
                            {block.kind === "time-hero" ? (
                                <ClockUnitTile className="flex items-center justify-center">
                                    <div className={cn("font-semibold leading-none text-white tabular-nums", heroValueClass)}>
                                        {parts.timeHM}
                                    </div>
                                </ClockUnitTile>
                            ) : null}
                            {block.kind === "time-single" ? (
                                <ClockUnitTile className="flex items-center justify-center">
                                    <div className={cn("font-semibold leading-none text-white tabular-nums", valueClass)}>
                                        {parts.timeHM}
                                    </div>
                                </ClockUnitTile>
                            ) : null}
                            {(block.kind === "time-hour" || block.kind === "time-minute") ? (
                                <ClockUnitTile>
                                    <div className="flex h-full min-h-0 flex-col justify-between">
                                        <div className={cn("text-white/72", labelClass)}>
                                            {block.kind === "time-hour" ? t("clock_h_short") : t("clock_m_short")}
                                        </div>
                                        <div className={cn("font-semibold leading-none text-white tabular-nums", valueClass)}>
                                            {block.kind === "time-hour" ? parts.hours : parts.minutes}
                                        </div>
                                    </div>
                                </ClockUnitTile>
                            ) : null}
                            {block.kind === "date" ? (
                                <ClockUnitTile>
                                    <div className="flex h-full min-h-0 items-center">
                                        <div className={cn("line-clamp-2 font-medium leading-snug text-white/84", compactValueClass)}>
                                            {parts.dateShort}
                                        </div>
                                    </div>
                                </ClockUnitTile>
                            ) : null}
                            {block.kind === "date-detail" ? (
                                <ClockUnitTile>
                                    <div className="flex h-full min-h-0 items-center">
                                        <div className={cn("line-clamp-2 font-medium leading-snug text-white/82", labelClass)}>
                                            {parts.dateLong}
                                        </div>
                                    </div>
                                </ClockUnitTile>
                            ) : null}
                            {block.kind === "weekday" ? (
                                <ClockUnitTile>
                                    <div className="flex h-full min-h-0 items-center justify-center">
                                        <div className={cn("line-clamp-2 text-center font-medium leading-snug text-white/82", compactValueClass)}>
                                            {parts.weekdayLong}
                                        </div>
                                    </div>
                                </ClockUnitTile>
                            ) : null}
                            {block.kind === "seconds" ? (
                                <ClockUnitTile>
                                    <div className="flex h-full min-h-0 flex-col justify-between">
                                        <div className={cn("text-white/72", labelClass)}>SEC</div>
                                        <div className={cn("font-semibold leading-none text-white/92 tabular-nums", valueClass)}>
                                            {parts.seconds}
                                        </div>
                                    </div>
                                </ClockUnitTile>
                            ) : null}
                            {block.kind === "day-progress" ? (
                                <ClockUnitTile className="flex items-center">
                                    <ProgressBar label={t("clock_day")} value={parts.dayProgress} compact />
                                </ClockUnitTile>
                            ) : null}
                            {block.kind === "week-progress" ? (
                                <ClockUnitTile className="flex items-center">
                                    <ProgressBar label={t("clock_week")} value={parts.weekProgress} compact />
                                </ClockUnitTile>
                            ) : null}
                        </div>
                    ))}
                </div>
            </div>
        </ClockWidgetShell>
    );
}

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

export const SYSTEM_WIDGET_MANIFEST = [
    {
        id: "clock",
        title: "widget_clock",
        icon: "Timer",
        variant: "panel",
        draggable: true,
        resizable: true,
        defaultPreset: "2x1",
        supportedPresets: ["1x1", "2x1", "1x2", "2x2", "2x4"],
        resizeRange: {
            minW: 1,
            maxW: 4,
            minH: 1,
            maxH: 4,
            axis: "both",
        },
        renderer: ClockWidgetRenderer,
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


import { useEffect, useState } from "react";
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
        <AppSurface variant="widget" className={cn("h-full w-full", className)}>
            {children}
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

type ClockToken =
    | "timePair"
    | "seconds"
    | "weekday"
    | "dateShort"
    | "dateLong"
    | "dayProgress"
    | "weekProgress";

type ClockTokenFamily = "time" | "seconds" | "weekday" | "date" | "day" | "week";
type ClockLayoutMode = "narrow" | "balanced" | "wide" | "ultra" | "fallback";

interface ClockTokenSpec {
    token: ClockToken;
    family: ClockTokenFamily;
    densityCost: number;
    utility: number;
    minWidth?: number;
    minHeight?: number;
    requires?: readonly ClockToken[];
    conflicts?: readonly ClockToken[];
}

interface ClockLayoutPlan {
    mode: ClockLayoutMode;
    tokens: Set<ClockToken>;
    density: number;
    targetDensity: number;
}

const CLOCK_TOKEN_SPECS: readonly ClockTokenSpec[] = [
    { token: "timePair", family: "time", densityCost: 12, utility: 100 },
    { token: "seconds", family: "seconds", densityCost: 3, utility: 24 },
    { token: "weekday", family: "weekday", densityCost: 3, utility: 18 },
    { token: "dateShort", family: "date", densityCost: 3, utility: 22 },
    { token: "dateLong", family: "date", densityCost: 5, utility: 26, minWidth: 4, conflicts: ["dateShort"] },
    { token: "dayProgress", family: "day", densityCost: 5, utility: 20, minWidth: 2 },
    { token: "weekProgress", family: "week", densityCost: 5, utility: 16, minWidth: 3, requires: ["dayProgress"] },
] as const;

function resolveClockLayoutMode(width: number, height: number): ClockLayoutMode {
    if (height === 2) {
        if (width <= 1) return "narrow";
        if (width === 2) return "balanced";
        if (width === 3) return "wide";
        return "ultra";
    }
    return "fallback";
}

function resolveClockTargetDensity(width: number): number {
    if (width <= 1) return 0.78;
    if (width === 2) return 0.84;
    if (width === 3) return 0.9;
    return 0.93;
}

function resolveTokenUtility(spec: ClockTokenSpec, width: number): number {
    if (spec.token === "dateLong") {
        return width >= 4 ? spec.utility + 8 : spec.utility - 10;
    }
    if (spec.token === "weekProgress") {
        return width >= 3 ? spec.utility + 2 : spec.utility - 8;
    }
    return spec.utility;
}

function buildClockLayoutPlan(width: number, height: number): ClockLayoutPlan {
    const mode = resolveClockLayoutMode(width, height);
    const targetDensity = resolveClockTargetDensity(width);
    const capacity = Math.max(1, width * height * 12);
    const selected = new Set<ClockToken>(["timePair"]);
    const selectedFamilies = new Set<ClockTokenFamily>(["time"]);
    const tokenMap = new Map(CLOCK_TOKEN_SPECS.map((spec) => [spec.token, spec]));
    let usedCost = tokenMap.get("timePair")?.densityCost ?? 12;

    const candidates = CLOCK_TOKEN_SPECS
        .filter((spec) => spec.token !== "timePair")
        .sort((a, b) => resolveTokenUtility(b, width) - resolveTokenUtility(a, width));

    for (const spec of candidates) {
        if (typeof spec.minWidth === "number" && width < spec.minWidth) continue;
        if (typeof spec.minHeight === "number" && height < spec.minHeight) continue;
        if (selectedFamilies.has(spec.family)) continue;
        if (spec.requires && !spec.requires.every((token) => selected.has(token))) continue;
        if (spec.conflicts && spec.conflicts.some((token) => selected.has(token))) continue;

        const projectedDensity = (usedCost + spec.densityCost) / capacity;
        if (projectedDensity > targetDensity + 0.06) continue;

        selected.add(spec.token);
        selectedFamilies.add(spec.family);
        usedCost += spec.densityCost;
    }

    if (!selected.has("dateShort") && !selected.has("dateLong")) {
        const preferredDate = width >= 4 ? "dateLong" : "dateShort";
        const fallbackDate = preferredDate === "dateLong" ? "dateShort" : "dateLong";
        const preferredSpec = tokenMap.get(preferredDate);
        if (
            preferredSpec &&
            (!preferredSpec.minWidth || width >= preferredSpec.minWidth) &&
            (!preferredSpec.minHeight || height >= preferredSpec.minHeight) &&
            (usedCost + preferredSpec.densityCost) / capacity <= targetDensity + 0.08
        ) {
            selected.add(preferredDate);
            selectedFamilies.add("date");
            usedCost += preferredSpec.densityCost;
        } else {
            const fallbackSpec = tokenMap.get(fallbackDate);
            if (
                fallbackSpec &&
                (!fallbackSpec.minWidth || width >= fallbackSpec.minWidth) &&
                (!fallbackSpec.minHeight || height >= fallbackSpec.minHeight) &&
                (usedCost + fallbackSpec.densityCost) / capacity <= targetDensity + 0.1
            ) {
                selected.add(fallbackDate);
                selectedFamilies.add("date");
                usedCost += fallbackSpec.densityCost;
            }
        }
    }

    const density = Math.min(1, usedCost / capacity);
    return { mode, tokens: selected, density, targetDensity };
}

function TimeSegment({
    label,
    value,
    compact = false,
}: {
    label: string;
    value: string;
    compact?: boolean;
}) {
    return (
        <div className="space-y-1 px-1 py-0.5">
            <div className={cn("text-white/72", compact ? "text-[9px]" : "text-[10px]")}>
                {label}
            </div>
            <div className={cn("font-semibold leading-none text-white", compact ? "text-[1.45rem]" : "text-[1.8rem]")}>
                {value}
            </div>
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

    useEffect(() => {
        const timer = window.setInterval(() => {
            setNow(new Date());
        }, 1000);
        return () => window.clearInterval(timer);
    }, []);

    const parts = getClockParts(now);
    const width = Math.max(1, Math.round(gridSize.w));
    const height = Math.max(1, Math.round(gridSize.h));
    const plan = buildClockLayoutPlan(width, height);
    const mode = plan.mode;

    const show = (token: ClockToken) => plan.tokens.has(token);
    const activeDateText = show("dateLong") ? parts.dateLong : parts.dateShort;
    const splitTime = (
        <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-1.5">
            <TimeSegment label={t("clock_h_short")} value={parts.hours} compact={width <= 2} />
            <div className="pb-1 text-center text-xl font-semibold text-white/88">:</div>
            <TimeSegment label={t("clock_m_short")} value={parts.minutes} compact={width <= 2} />
        </div>
    );

    return (
        <ClockWidgetShell className={className} onActivate={onActivate}>
            <div className="flex h-full min-h-0 flex-col overflow-hidden">
                {mode === "narrow" ? (
                    <div className="flex min-h-0 flex-1 flex-col justify-between gap-2">
                        <div className="space-y-2">
                            {splitTime}
                            {show("weekday") ? (
                                <div className="text-xs text-white/72">{parts.weekdayLong}</div>
                            ) : null}
                        </div>
                        <div className="space-y-1">
                            {show("seconds") ? (
                                <div className="text-[11px] text-white/72">{t("clock_seconds", { seconds: parts.seconds })}</div>
                            ) : null}
                            {(show("dateShort") || show("dateLong")) ? (
                                <div className="text-xs font-medium text-white/88">{parts.dateShort}</div>
                            ) : null}
                        </div>
                    </div>
                ) : null}

                {mode === "balanced" ? (
                    <div className="grid min-h-0 flex-1 grid-rows-[auto_auto_1fr] gap-2">
                        {splitTime}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            {show("weekday") ? <div className="text-white/72">{parts.weekdayLong}</div> : <span />}
                            {(show("dateShort") || show("dateLong")) ? <div className="text-right text-white/72">{parts.dateShort}</div> : <span />}
                        </div>
                        <div className="flex min-h-0 flex-col justify-end gap-1.5">
                            {show("seconds") ? (
                                <div className="text-[11px] text-white/72">{t("clock_seconds", { seconds: parts.seconds })}</div>
                            ) : null}
                            {show("dayProgress") ? (
                                <ProgressBar label={t("clock_day")} value={parts.dayProgress} compact />
                            ) : null}
                        </div>
                    </div>
                ) : null}

                {mode === "wide" ? (
                    <div className="grid min-h-0 flex-1 grid-cols-[1.2fr_1fr] gap-2.5">
                        <div className="flex min-h-0 flex-col justify-between">
                            <div className="space-y-2">
                                {splitTime}
                                <div className="space-y-1 text-xs text-white/72">
                                    {show("weekday") ? <div>{parts.weekdayLong}</div> : null}
                                </div>
                            </div>
                            {(show("dateShort") || show("dateLong")) ? (
                                <div className="text-xs text-white/72">{activeDateText}</div>
                            ) : null}
                        </div>
                        <div className="flex min-h-0 flex-col justify-between gap-2">
                            <div className="space-y-1.5">
                                {show("dayProgress") ? <ProgressBar label={t("clock_day")} value={parts.dayProgress} compact /> : null}
                                {show("weekProgress") ? <ProgressBar label={t("clock_week")} value={parts.weekProgress} compact /> : null}
                            </div>
                            {show("seconds") ? (
                                <div className="px-2 py-1.5 text-[11px] text-white/72">
                                    {t("clock_seconds", { seconds: parts.seconds })}
                                </div>
                            ) : null}
                        </div>
                    </div>
                ) : null}

                {mode === "ultra" ? (
                    <div className="grid min-h-0 flex-1 grid-cols-[1.1fr_1fr_1fr] gap-2.5">
                        <div className="flex min-h-0 flex-col justify-between gap-2">
                            {splitTime}
                            <div className="space-y-1 text-xs text-white/72">
                                {show("weekday") ? <div>{parts.weekdayLong}</div> : null}
                            </div>
                        </div>
                        <div className="flex min-h-0 flex-col justify-between gap-2">
                            <div className="space-y-1 px-2.5 py-2">
                                {(show("dateShort") || show("dateLong")) ? (
                                    <div className="text-xs text-white/72">{activeDateText}</div>
                                ) : null}
                                {show("seconds") ? (
                                    <div className="text-sm font-medium text-white/88">{t("clock_seconds", { seconds: parts.seconds })}</div>
                                ) : null}
                            </div>
                            {show("dayProgress") ? <ProgressBar label={t("clock_day")} value={parts.dayProgress} compact /> : null}
                        </div>
                        <div className="flex min-h-0 flex-col justify-between gap-2">
                            {show("weekProgress") ? <ProgressBar label={t("clock_week")} value={parts.weekProgress} compact /> : null}
                            {!show("dayProgress") ? <ProgressBar label={t("clock_day")} value={parts.dayProgress} compact /> : null}
                        </div>
                    </div>
                ) : null}

                {mode === "fallback" ? (
                    <div className="flex min-h-0 flex-1 flex-col justify-between">
                        <div className="space-y-2">
                            {splitTime}
                            {(show("dateShort") || show("dateLong")) ? <div className="text-xs text-white/72">{activeDateText}</div> : null}
                        </div>
                        <div className="space-y-1.5">
                            {show("seconds") ? <div className="text-[11px] text-white/72">{t("clock_seconds", { seconds: parts.seconds })}</div> : null}
                            {show("dayProgress") ? <ProgressBar label={t("clock_day")} value={parts.dayProgress} compact /> : null}
                            {show("weekProgress") ? <ProgressBar label={t("clock_week")} value={parts.weekProgress} compact /> : null}
                        </div>
                    </div>
                ) : null}
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
        defaultPreset: "2x2",
        supportedPresets: ["1x2", "2x2"],
        resizeRange: {
            minW: 1,
            maxW: 4,
            minH: 2,
            maxH: 2,
            axis: "horizontal",
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


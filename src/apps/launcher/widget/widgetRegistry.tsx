import { useEffect, useState } from "react";
import { cn } from "@/platform/core/utils";
import type { LauncherWidgetItem } from "@/platform/state/core/itemTypes";
import { useUIStore } from "@/apps/launcher/store/ui";
import { Edit2, X } from "lucide-react";
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
    className?: string;
    onActivate?: (event?: React.MouseEvent) => void;
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
    renderer: React.ComponentType<WidgetRenderProps>;
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
                "group flex h-full w-full rounded-2xl border border-white/20 bg-white/55 p-3 text-left backdrop-blur-md transition-all hover:bg-white/70 dark:border-white/10 dark:bg-black/35 dark:hover:bg-black/45",
                "cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                className
            )}
        >
            <div className="flex h-full w-full flex-col justify-between">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-black shadow-sm dark:bg-black dark:text-white">
                    {renderSystemIcon(item.icon || "", "h-4 w-4")}
                </div>
                {children}
            </div>
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
            <div className={cn("flex items-center justify-between text-muted-foreground", compact ? "text-[9px]" : "text-[10px]")}>
                <span>{label}</span>
                <span>{percent}%</span>
            </div>
            <div className={cn("w-full rounded-full bg-black/10 dark:bg-white/10", compact ? "h-1.5" : "h-2")}>
                <div
                    className="h-full rounded-full bg-foreground/80 transition-[width] duration-300 ease-out"
                    style={{ width: `${percent}%` }}
                />
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
                "group h-full w-full rounded-2xl border border-white/20 bg-white/55 p-3 text-left backdrop-blur-md transition-all hover:bg-white/70 dark:border-white/10 dark:bg-black/35 dark:hover:bg-black/45",
                "cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                className
            )}
        >
            {children}
        </div>
    );
}

function ClockWidgetRenderer({ preset, className, onActivate }: WidgetRenderProps) {
    const [now, setNow] = useState(() => new Date());

    useEffect(() => {
        const timer = window.setInterval(() => {
            setNow(new Date());
        }, 1000);
        return () => window.clearInterval(timer);
    }, []);

    const parts = getClockParts(now);
    const isWideCompact = preset === "2x1";
    const isTallCompact = preset === "1x2";
    const isMedium = preset === "2x2";
    const isTallExtended = preset === "2x4";

    return (
        <ClockWidgetShell className={className} onActivate={onActivate}>
            <div className="flex h-full min-h-0 flex-col overflow-hidden">
                {isWideCompact ? (
                    <div className="grid min-h-0 flex-1 grid-cols-[1.25fr_1fr] items-end gap-2">
                        <div className={cn(
                            "font-semibold leading-none tracking-tight text-foreground",
                            "text-[2.05rem]"
                        )}>
                            {parts.timeHM}
                        </div>
                        <div className="space-y-1 text-right">
                            <div className="text-xs font-medium text-foreground/90">{parts.dateShort}</div>
                            <div className="text-[11px] text-muted-foreground">Sec {parts.seconds}</div>
                        </div>
                    </div>
                ) : null}

                {isTallCompact ? (
                    <div className="flex min-h-0 flex-1 flex-col justify-between">
                        <div>
                            <div className="text-[2rem] font-semibold leading-none tracking-tight text-foreground">
                                {parts.timeHM}
                            </div>
                            <div className="mt-1 text-xs text-muted-foreground">{parts.weekdayLong}</div>
                        </div>
                        <div className="space-y-1">
                            <div className="text-xs font-medium text-foreground/90">{parts.dateShort}</div>
                            <div className="text-[11px] text-muted-foreground">Sec {parts.seconds}</div>
                            <ProgressBar label="Day" value={parts.dayProgress} compact />
                        </div>
                    </div>
                ) : null}

                {isMedium ? (
                    <div className="flex min-h-0 flex-1 flex-col justify-between">
                        <div>
                            <div className="text-[2.2rem] font-semibold leading-none tracking-tight text-foreground">
                                {parts.timeHM}
                            </div>
                            <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                                <span>{parts.dateShort}</span>
                                <span>Sec {parts.seconds}</span>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <ProgressBar label="Day" value={parts.dayProgress} compact />
                            <ProgressBar label="Week" value={parts.weekProgress} compact />
                        </div>
                    </div>
                ) : null}

                {isTallExtended ? (
                    <div className="flex min-h-0 flex-1 flex-col justify-between">
                        <div>
                            <div className="text-[2.2rem] font-semibold leading-none tracking-tight text-foreground">
                                {parts.timeHM}
                            </div>
                            <div className="mt-1 text-xs text-muted-foreground">{parts.dateLong}</div>
                            <div className="text-xs text-muted-foreground">{parts.weekdayLong}</div>
                        </div>

                        <div className="space-y-2">
                            <ProgressBar label="Day" value={parts.dayProgress} compact />
                            <ProgressBar label="Week" value={parts.weekProgress} compact />
                            <div className="grid grid-cols-3 gap-1.5 rounded-lg bg-black/5 p-1.5 text-center dark:bg-white/5">
                                <div>
                                    <div className="text-[9px] text-muted-foreground">H</div>
                                    <div className="text-xs font-semibold">{parts.timeHM.slice(0, 2)}</div>
                                </div>
                                <div>
                                    <div className="text-[9px] text-muted-foreground">M</div>
                                    <div className="text-xs font-semibold">{parts.timeHM.slice(3, 5)}</div>
                                </div>
                                <div>
                                    <div className="text-[9px] text-muted-foreground">S</div>
                                    <div className="text-xs font-semibold">{parts.seconds}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>

            {!isWideCompact && !isTallCompact && !isMedium && !isTallExtended ? (
                <div className="text-xs text-muted-foreground">
                    {parts.dateShort}
                </div>
            ) : null}
        </ClockWidgetShell>
    );
}

function AppShortcutWidgetRenderer({ item, className, onActivate }: WidgetRenderProps) {
    return (
        <WidgetCardFrame item={item} className={className} onActivate={onActivate}>
            <div className="space-y-1">
                <div className="line-clamp-1 text-sm font-semibold text-foreground">
                    {item.title}
                </div>
                <div className="text-xs text-muted-foreground">
                    Open App
                </div>
            </div>
        </WidgetCardFrame>
    );
}

export const SYSTEM_WIDGET_MANIFEST = [
    {
        id: "clock",
        title: "Clock",
        icon: "Timer",
        launchAppId: "pomodoro",
        variant: "panel",
        draggable: true,
        resizable: false,
        defaultPreset: "2x1",
        supportedPresets: ["2x1", "1x2", "2x2", "2x4"],
        renderer: ClockWidgetRenderer,
    },
    {
        id: "ai-assistant-panel",
        title: "AI Assistant",
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
    {
        id: "paper-notes-panel",
        title: "Paper",
        icon: "FileText",
        ownerAppId: "paper",
        launchAppId: "paper",
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
        case "paper":
            return "paper-notes-panel";
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
    className?: string;
    onActivate?: (event?: React.MouseEvent) => void;
    onEdit?: (item: LauncherWidgetItem) => void;
    onDeletePrompt?: (item: LauncherWidgetItem) => void;
    isOverlay?: boolean;
}

export function LauncherWidgetItem({
    item,
    preset,
    className,
    onActivate,
    onEdit,
    onDeletePrompt,
    isOverlay,
}: LauncherWidgetItemProps) {
    const { isEditing } = useUIStore();
    const widget = getWidgetManifestItem(item.widgetId);
    const Renderer = widget?.renderer ?? AppShortcutWidgetRenderer;

    const handleEdit = (event: React.MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();
        onEdit?.(item);
    };

    const handleDelete = (event: React.MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();
        onDeletePrompt?.(item);
    };

    if (!widget) {
        return (
            <div className={cn("group relative h-full w-full", className)}>
                <div className={cn(
                    "absolute -top-3 -right-3 flex gap-1 transition-all z-20 p-1 rounded-full bg-background/50 backdrop-blur-md border shadow-sm",
                    (isEditing && !isOverlay) ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
                )}>
                    <button
                        onClick={handleEdit}
                        className="p-1 bg-primary text-primary-foreground rounded-full shadow-sm hover:scale-110 transition-transform cursor-pointer"
                        title="Edit"
                    >
                        <Edit2 size={10} />
                    </button>
                    <button
                        onClick={handleDelete}
                        className="p-1 bg-destructive text-destructive-foreground rounded-full shadow-sm hover:scale-110 transition-transform cursor-pointer"
                        title="Remove"
                    >
                        <X size={10} />
                    </button>
                </div>

                <Renderer
                    item={item}
                    preset={preset}
                    className="h-full w-full"
                    onActivate={onActivate}
                />
            </div>
        );
    }

    return (
        <div className={cn("group relative h-full w-full", className)}>
            <div className={cn(
                "absolute -top-3 -right-3 flex gap-1 transition-all z-20 p-1 rounded-full bg-background/50 backdrop-blur-md border shadow-sm",
                (isEditing && !isOverlay) ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
            )}>
                <button
                    onClick={handleEdit}
                    className="p-1 bg-primary text-primary-foreground rounded-full shadow-sm hover:scale-110 transition-transform cursor-pointer"
                    title="Edit"
                >
                    <Edit2 size={10} />
                </button>
                <button
                    onClick={handleDelete}
                    className="p-1 bg-destructive text-destructive-foreground rounded-full shadow-sm hover:scale-110 transition-transform cursor-pointer"
                    title="Remove"
                >
                    <X size={10} />
                </button>
            </div>

            <Renderer
                item={item}
                preset={preset}
                className="h-full w-full"
                onActivate={onActivate}
            />
        </div>
    );
}

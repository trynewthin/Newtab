/* eslint-disable react-refresh/only-export-components */
import type { WidgetManifest } from "@/shared/types";
import {
    type SystemAppId,
    isSystemAppId,
} from "@/launcher/registry/appManifest";
import {
    LargeClockRenderer,
    DayProgressRenderer,
    WeekProgressRenderer,
} from "@/launcher/ui/widgets/timeWidgets";

export type SystemWidgetManifestItem = Omit<
    WidgetManifest,
    "ownerAppId" | "launchAppId"
> & {
    ownerAppId?: SystemAppId;
    launchAppId?: SystemAppId;
};

export const SYSTEM_WIDGET_MANIFEST: readonly SystemWidgetManifestItem[] = [
    {
        id: "large-clock",
        title: "widget_large_clock",
        icon: "Clock",
        collection: "time",
        variant: "panel",
        draggable: true,
        resizable: false,
        defaultPreset: "4x2",
        supportedPresets: ["4x2"],
        renderer: LargeClockRenderer,
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
] as const;

type WidgetManifestItem = (typeof SYSTEM_WIDGET_MANIFEST)[number];
export type SystemWidgetId = WidgetManifestItem["id"];

export function isSystemWidgetId(value: string): value is SystemWidgetId {
    return SYSTEM_WIDGET_MANIFEST.some((entry) => entry.id === value);
}

export function getWidgetManifestItem(widgetId: string): SystemWidgetManifestItem | null {
    return SYSTEM_WIDGET_MANIFEST.find((entry) => entry.id === widgetId) ?? null;
}

export function getWidgetsByOwnerApp(appId: SystemAppId): readonly SystemWidgetManifestItem[] {
    return SYSTEM_WIDGET_MANIFEST.filter((entry) => entry.ownerAppId === appId);
}

export function getWidgetsByCollection(collection: string): readonly SystemWidgetManifestItem[] {
    return SYSTEM_WIDGET_MANIFEST.filter((entry) => entry.collection === collection);
}

export function getWidgetCollections(): string[] {
    const set = new Set<string>();
    for (const entry of SYSTEM_WIDGET_MANIFEST) {
        if (entry.collection) {
            set.add(entry.collection);
        }
    }
    return [...set];
}

export function resolveLegacyWidgetId(appId: string): SystemWidgetId | null {
    if (!isSystemAppId(appId)) {
        return null;
    }

    switch (appId) {
        default:
            return null;
    }
}

export function resolveWidgetLaunchAppId(widgetId: string, ownerAppId?: string): SystemAppId | null {
    const item = getWidgetManifestItem(widgetId);
    if (item?.launchAppId) {
        return item.launchAppId;
    }
    if (item?.ownerAppId) {
        return item.ownerAppId;
    }
    if (ownerAppId && isSystemAppId(ownerAppId)) {
        return ownerAppId;
    }
    return null;
}

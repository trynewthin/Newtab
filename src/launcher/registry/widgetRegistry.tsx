/* eslint-disable react-refresh/only-export-components */
import type { WidgetConfig, WidgetConfigField, WidgetManifest } from "@/shared/types";
import {
    type SystemAppId,
    isSystemAppId,
} from "@/launcher/registry/appManifest";
import { ConfigurableClockWidget } from "@/launcher/ui/widgets";

export type SystemWidgetManifestItem = Omit<
    WidgetManifest,
    "ownerAppId" | "launchAppId"
> & {
    ownerAppId?: SystemAppId;
    launchAppId?: SystemAppId;
};

export const SYSTEM_WIDGET_MANIFEST: readonly SystemWidgetManifestItem[] = [
    {
        id: "clock-4x2",
        title: "widget_clock_4x2",
        icon: "Clock",
        collection: "time",
        variant: "panel",
        draggable: true,
        resizable: false,
        defaultPreset: "4x2",
        supportedPresets: ["4x2"],
        configFields: [
            {
                key: "showSeconds",
                type: "switch",
                label: "widget_config_show_seconds",
                defaultValue: true,
            },
            {
                key: "accentHue",
                type: "range",
                label: "widget_config_accent_hue",
                defaultValue: 210,
                min: 0,
                max: 360,
                step: 1,
            },
        ],
        renderer: ConfigurableClockWidget,
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

export function getWidgetDefaultConfig(widgetId: string): WidgetConfig {
    const widget = getWidgetManifestItem(widgetId);
    return buildDefaultWidgetConfig(widget?.configFields);
}

export function normalizeWidgetConfig(
    widgetId: string,
    config?: WidgetConfig
): WidgetConfig {
    const widget = getWidgetManifestItem(widgetId);
    return normalizeWidgetConfigValue(widget?.configFields, config);
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

    return null;
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

function buildDefaultWidgetConfig(
    fields: readonly WidgetConfigField[] | undefined
): WidgetConfig {
    if (!fields) {
        return {};
    }

    return Object.fromEntries(
        fields.map((field) => [field.key, field.defaultValue])
    );
}

function normalizeWidgetConfigValue(
    fields: readonly WidgetConfigField[] | undefined,
    config?: WidgetConfig
): WidgetConfig {
    if (!fields || fields.length === 0) {
        return {};
    }

    const source = config ?? {};
    const next: WidgetConfig = {};

    for (const field of fields) {
        const candidate = source[field.key];

        if (field.type === "text") {
            next[field.key] = typeof candidate === "string" ? candidate : field.defaultValue;
            continue;
        }

        if (field.type === "select") {
            const nextValue = typeof candidate === "string"
                ? candidate
                : field.defaultValue;
            next[field.key] = field.options.some((option) => option.value === nextValue)
                ? nextValue
                : field.defaultValue;
            continue;
        }

        if (field.type === "switch") {
            next[field.key] = typeof candidate === "boolean" ? candidate : field.defaultValue;
            continue;
        }

        const rawValue = typeof candidate === "number" && Number.isFinite(candidate)
            ? candidate
            : field.defaultValue;
        next[field.key] = Math.max(field.min, Math.min(field.max, rawValue));
    }

    return next;
}

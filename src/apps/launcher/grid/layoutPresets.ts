import type { GridItem } from "@/platform/state/core/itemTypes";
import { getAppLauncherLayoutConfig, isSystemAppId } from "@/apps/launcher/system/appManifest";
import { getWidgetManifestItem } from "@/apps/launcher/widget";

export const GRID_COLS = 24;
export const GRID_ROW_HEIGHT = 34;
export const GRID_MARGIN = 12;

// 语义尺寸（1x1 / 2x1 / 1x2 / 2x2 / 2x4）映射到当前 RGL 单位。
// 当前网格中，1x1 图标单元使用标准语义单位 (w=1, h=1)。
export const GRID_ITEM_PRESETS = {
    "1x1": { w: 1, h: 1 },
    "2x1": { w: 2, h: 1 },
    "1x2": { w: 1, h: 2 },
    "2x2": { w: 2, h: 2 },
    "2x4": { w: 2, h: 4 },
} as const;

export type GridPresetKey = keyof typeof GRID_ITEM_PRESETS;

export const DEFAULT_GRID_PRESET: GridPresetKey = "1x1";

export type GridTileVariant = "icon" | "panel";

export interface GridItemLayoutCapability {
    variant: GridTileVariant;
    draggable: boolean;
    resizable: boolean;
    defaultPreset: GridPresetKey;
    allowedPresets: readonly GridPresetKey[];
}

export function getDefaultGridSize() {
    return GRID_ITEM_PRESETS[DEFAULT_GRID_PRESET];
}

const ICON_ONLY_CAPABILITY: GridItemLayoutCapability = {
    variant: "icon",
    draggable: true,
    resizable: false,
    defaultPreset: "1x1",
    allowedPresets: ["1x1"],
};

function isGridPresetKey(value: string): value is GridPresetKey {
    return value in GRID_ITEM_PRESETS;
}

function normalizeAllowedPresets(presets: readonly string[], fallback: GridPresetKey): readonly GridPresetKey[] {
    const filtered = presets.filter(isGridPresetKey);
    if (filtered.length === 0) {
        return [fallback];
    }

    return Array.from(new Set(filtered));
}

function getAppIconCapability(item: GridItem): GridItemLayoutCapability {
    if (item.kind !== "app") return ICON_ONLY_CAPABILITY;
    if (!isSystemAppId(item.appId)) return ICON_ONLY_CAPABILITY;

    const launcher = getAppLauncherLayoutConfig(item.appId);
    if (!launcher) return ICON_ONLY_CAPABILITY;

    const defaultPreset = isGridPresetKey(launcher.icon.defaultPreset)
        ? launcher.icon.defaultPreset
        : DEFAULT_GRID_PRESET;
    const allowedPresets = normalizeAllowedPresets(launcher.icon.allowedPresets, defaultPreset);

    return {
        variant: launcher.icon.variant,
        draggable: launcher.icon.draggable,
        resizable: launcher.icon.resizable,
        defaultPreset,
        allowedPresets,
    };
}

// 统一 item 布局能力入口：app 读 manifest.icon，widget 读 widget manifest。
export function getItemLayoutCapability(item: GridItem): GridItemLayoutCapability {
    if (item.kind === "widget") {
        const widget = getWidgetManifestItem(item.widgetId);
        if (!widget) {
            return {
                variant: "panel",
                draggable: true,
                resizable: false,
                defaultPreset: "2x2",
                allowedPresets: ["2x2"],
            };
        }

        const defaultPreset = isGridPresetKey(widget.defaultPreset)
            ? widget.defaultPreset
            : "2x2";
        const allowedPresets = normalizeAllowedPresets(widget.supportedPresets, defaultPreset);
        return {
            variant: widget.variant,
            draggable: widget.draggable,
            resizable: widget.resizable,
            defaultPreset,
            allowedPresets,
        };
    }

    if (item.kind !== "app") {
        return ICON_ONLY_CAPABILITY;
    }

    return getAppIconCapability(item);
}

export function resolvePresetSize(preset: GridPresetKey) {
    return GRID_ITEM_PRESETS[preset];
}

export function sanitizeGridSize(item: GridItem): { w: number; h: number } {
    const capability = getItemLayoutCapability(item);
    const fallback = resolvePresetSize(capability.defaultPreset);
    const currentPreset = resolveGridPreset(item);

    if (currentPreset === "custom") {
        return fallback;
    }

    if (!capability.allowedPresets.includes(currentPreset)) {
        return fallback;
    }

    return resolvePresetSize(currentPreset);
}

export function resolveGridPreset(item: Pick<GridItem, "w" | "h">): GridPresetKey | "custom" {
    const w = item.w;
    const h = item.h;

    if (typeof w !== "number" || typeof h !== "number") {
        return DEFAULT_GRID_PRESET;
    }

    const presets = Object.entries(GRID_ITEM_PRESETS) as Array<[GridPresetKey, { w: number; h: number }]>;
    for (const [key, preset] of presets) {
        if (preset.w === w && preset.h === h) {
            return key;
        }
    }

    return "custom";
}

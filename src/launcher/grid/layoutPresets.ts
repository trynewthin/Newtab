import type { GridItem } from "@/state/core/itemTypes";
import { getAppLauncherLayoutConfig, isSystemAppId } from "@/launcher/system/appManifest";
import { getWidgetManifestItem } from "@/launcher/widget";

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
    "4x2": { w: 4, h: 2 },
} as const;

export type GridPresetKey = keyof typeof GRID_ITEM_PRESETS;

export const DEFAULT_GRID_PRESET: GridPresetKey = "1x1";

export type GridTileVariant = "icon" | "panel";
export type GridResizeAxis = "both" | "horizontal" | "vertical";

export interface GridItemLayoutCapability {
    variant: GridTileVariant;
    draggable: boolean;
    resizable: boolean;
    defaultPreset: GridPresetKey;
    allowedPresets: readonly GridPresetKey[];
    minW: number;
    maxW: number;
    minH: number;
    maxH: number;
    resizeAxis: GridResizeAxis;
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
    minW: 1,
    maxW: 1,
    minH: 1,
    maxH: 1,
    resizeAxis: "both",
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
        minW: GRID_ITEM_PRESETS[defaultPreset].w,
        maxW: GRID_ITEM_PRESETS[defaultPreset].w,
        minH: GRID_ITEM_PRESETS[defaultPreset].h,
        maxH: GRID_ITEM_PRESETS[defaultPreset].h,
        resizeAxis: "both",
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
                minW: 2,
                maxW: 2,
                minH: 2,
                maxH: 2,
                resizeAxis: "both",
            };
        }

        const defaultPreset = isGridPresetKey(widget.defaultPreset)
            ? widget.defaultPreset
            : "2x2";
        const defaultSize = GRID_ITEM_PRESETS[defaultPreset];
        const allowedPresets = normalizeAllowedPresets(widget.supportedPresets, defaultPreset);
        const minW = Math.max(1, Math.floor(widget.resizeRange?.minW ?? defaultSize.w));
        const maxW = Math.max(minW, Math.floor(widget.resizeRange?.maxW ?? defaultSize.w));
        const minH = Math.max(1, Math.floor(widget.resizeRange?.minH ?? defaultSize.h));
        const maxH = Math.max(minH, Math.floor(widget.resizeRange?.maxH ?? defaultSize.h));
        return {
            variant: widget.variant,
            draggable: widget.draggable,
            resizable: widget.resizable,
            defaultPreset,
            allowedPresets,
            minW,
            maxW,
            minH,
            maxH,
            resizeAxis: widget.resizeRange?.axis ?? "both",
        };
    }

    if (item.kind === "folder") {
        const mode = item.displayMode ?? "1x1";
        if (mode === "2x2") {
            return {
                variant: "panel",
                draggable: true,
                resizable: false,
                defaultPreset: "2x2",
                allowedPresets: ["2x2"],
                minW: 2,
                maxW: 2,
                minH: 2,
                maxH: 2,
                resizeAxis: "both",
            };
        }
        return ICON_ONLY_CAPABILITY;
    }

    if (item.kind !== "app") {
        return ICON_ONLY_CAPABILITY;
    }

    return getAppIconCapability(item);
}

export function resolvePresetSize(preset: GridPresetKey) {
    return GRID_ITEM_PRESETS[preset];
}

function clampToRange(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

export function sanitizeGridSize(item: GridItem): { w: number; h: number } {
    const capability = getItemLayoutCapability(item);
    const fallback = resolvePresetSize(capability.defaultPreset);
    const currentPreset = resolveGridPreset(item);
    let rawW: number = fallback.w;
    let rawH: number = fallback.h;

    if (currentPreset !== "custom" && capability.allowedPresets.includes(currentPreset)) {
        const presetSize = resolvePresetSize(currentPreset);
        rawW = presetSize.w;
        rawH = presetSize.h;
    } else if (typeof item.w === "number" && typeof item.h === "number" && capability.resizable) {
        rawW = Math.floor(item.w);
        rawH = Math.floor(item.h);
    }

    const clampedW = clampToRange(rawW, capability.minW, capability.maxW);
    const clampedH = clampToRange(rawH, capability.minH, capability.maxH);

    if (!capability.resizable) {
        return { w: fallback.w, h: fallback.h };
    }

    if (capability.resizeAxis === "horizontal") {
        return { w: clampedW, h: clampToRange(fallback.h, capability.minH, capability.maxH) };
    }

    if (capability.resizeAxis === "vertical") {
        return { w: clampToRange(fallback.w, capability.minW, capability.maxW), h: clampedH };
    }

    return { w: clampedW, h: clampedH };
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

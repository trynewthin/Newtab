import type { AppSurfaceVariant } from "@/core/surfaceMaterials";

export type FrostedPreset = {
    backgroundOpacity: number;
    saturation: number;
    blur: number;
    borderOpacity: number;
    highlightOpacity: number;
    shadowOpacity: number;
    borderRadius: number;
};

export type FrostedPresetMap = Record<AppSurfaceVariant, { light: FrostedPreset; dark: FrostedPreset }>;

export const FROSTED_VARIANT_PRESETS: FrostedPresetMap = {
    base: {
        light: { backgroundOpacity: 0.38, saturation: 1.8, blur: 40, borderOpacity: 0.35, highlightOpacity: 0.08, shadowOpacity: 0.1, borderRadius: 18 },
        dark: { backgroundOpacity: 0.32, saturation: 1.6, blur: 40, borderOpacity: 0.12, highlightOpacity: 0.04, shadowOpacity: 0.25, borderRadius: 18 },
    },
    toolbar: {
        light: { backgroundOpacity: 0.36, saturation: 1.8, blur: 40, borderOpacity: 0.35, highlightOpacity: 0.08, shadowOpacity: 0.08, borderRadius: 28 },
        dark: { backgroundOpacity: 0.3, saturation: 1.6, blur: 40, borderOpacity: 0.1, highlightOpacity: 0.03, shadowOpacity: 0.25, borderRadius: 28 },
    },
    "search-bar": {
        light: { backgroundOpacity: 0.38, saturation: 1.8, blur: 40, borderOpacity: 0.38, highlightOpacity: 0.1, shadowOpacity: 0.08, borderRadius: 50 },
        dark: { backgroundOpacity: 0.32, saturation: 1.6, blur: 40, borderOpacity: 0.12, highlightOpacity: 0.04, shadowOpacity: 0.25, borderRadius: 50 },
    },
    widget: {
        light: { backgroundOpacity: 0.36, saturation: 1.8, blur: 40, borderOpacity: 0, highlightOpacity: 0.08, shadowOpacity: 0.08, borderRadius: 24 },
        dark: { backgroundOpacity: 0.3, saturation: 1.6, blur: 40, borderOpacity: 0, highlightOpacity: 0.03, shadowOpacity: 0.25, borderRadius: 24 },
    },
    "folder-preview": {
        light: { backgroundOpacity: 0.38, saturation: 1.8, blur: 40, borderOpacity: 0.35, highlightOpacity: 0.09, shadowOpacity: 0.1, borderRadius: 32 },
        dark: { backgroundOpacity: 0.32, saturation: 1.6, blur: 40, borderOpacity: 0.12, highlightOpacity: 0.04, shadowOpacity: 0.25, borderRadius: 32 },
    },
};

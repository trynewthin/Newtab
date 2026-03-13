import type { GlassSurfaceProps } from "@/platform/ui/effects/GlassSurface";
import type { AppSurfaceVariant } from "@/core/surfaceMaterials";

export type SurfacePresetMap = Record<AppSurfaceVariant, { light: Partial<GlassSurfaceProps>; dark: Partial<GlassSurfaceProps> }>;

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

export const DISTORTION_VARIANT_PRESETS: SurfacePresetMap = {
    base: {
        light: { backgroundOpacity: 0.18, saturation: 1.18, brightness: 54, opacity: 0.93, blur: 11 },
        dark: { backgroundOpacity: 0.24, saturation: 1.24, brightness: 58, opacity: 0.95, blur: 12 },
    },
    toolbar: {
        light: { borderRadius: 28, blur: 10 },
        dark: { borderRadius: 28, blur: 11 },
    },
    "search-bar": {
        light: { width: "100%", height: "100%", borderRadius: 50, displace: 3.0 },
        dark: { width: "100%", height: "100%", borderRadius: 50, displace: 3.0 },
    },
    widget: {
        light: { width: "100%", height: "100%", borderRadius: 24, borderWidth: 0 },
        dark: { width: "100%", height: "100%", borderRadius: 24, borderWidth: 0 },
    },
    "folder-preview": {
        light: { width: "100%", height: "100%", borderRadius: 32 },
        dark: { width: "100%", height: "100%", borderRadius: 32 },
    },
};

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



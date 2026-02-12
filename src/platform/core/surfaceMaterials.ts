export type AppSurfaceMaterial = "glass-distortion" | "mac-frosted";
export type AppSurfaceVariant = "base" | "toolbar" | "search-bar" | "widget" | "folder-preview";
export type AppSurfaceTone = "auto" | "light" | "dark";

export type SurfaceBlendMode =
    | "normal"
    | "multiply"
    | "screen"
    | "overlay"
    | "darken"
    | "lighten"
    | "color-dodge"
    | "color-burn"
    | "hard-light"
    | "soft-light"
    | "difference"
    | "exclusion"
    | "hue"
    | "saturation"
    | "color"
    | "luminosity"
    | "plus-darker"
    | "plus-lighter";

export interface DistortionGlassMaterialConfig {
    backgroundOpacity: number;
    saturation: number;
    brightness: number;
    opacity: number;
    blur: number;
    displace: number;
    borderWidth: number;
    distortionScale: number;
    redOffset: number;
    greenOffset: number;
    blueOffset: number;
    mixBlendMode: SurfaceBlendMode;
}

export interface MacFrostedMaterialConfig {
    backgroundOpacity: number;
    saturation: number;
    blur: number;
    borderOpacity: number;
    highlightOpacity: number;
    shadowOpacity: number;
}

export interface AppSurfaceMaterialConfigMap {
    "glass-distortion": DistortionGlassMaterialConfig;
    "mac-frosted": MacFrostedMaterialConfig;
}

export const SURFACE_MATERIAL_OPTIONS: readonly AppSurfaceMaterial[] = [
    "glass-distortion",
    "mac-frosted",
] as const;

export const DEFAULT_APP_SURFACE_MATERIAL_CONFIG: AppSurfaceMaterialConfigMap = {
    "glass-distortion": {
        backgroundOpacity: 0.2,
        saturation: 1.24,
        brightness: 56,
        opacity: 0.94,
        blur: 11,
        displace: 5.0,
        borderWidth: 0.08,
        distortionScale: -150,
        redOffset: 4,
        greenOffset: 12,
        blueOffset: 22,
        mixBlendMode: "screen",
    },
    "mac-frosted": {
        backgroundOpacity: 0.28,
        saturation: 1.2,
        blur: 16,
        borderOpacity: 0.24,
        highlightOpacity: 0.18,
        shadowOpacity: 0.17,
    },
};

export function mergeSurfaceMaterialConfig(
    partial?: Partial<{
        "glass-distortion": Partial<DistortionGlassMaterialConfig>;
        "mac-frosted": Partial<MacFrostedMaterialConfig>;
    }> | null
): AppSurfaceMaterialConfigMap {
    return {
        "glass-distortion": {
            ...DEFAULT_APP_SURFACE_MATERIAL_CONFIG["glass-distortion"],
            ...(partial?.["glass-distortion"] ?? {}),
        },
        "mac-frosted": {
            ...DEFAULT_APP_SURFACE_MATERIAL_CONFIG["mac-frosted"],
            ...(partial?.["mac-frosted"] ?? {}),
        },
    };
}

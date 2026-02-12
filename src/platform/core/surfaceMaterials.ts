export type AppSurfaceMaterial = "glass-distortion" | "glass-rays";
export type AppSurfaceVariant = "base" | "toolbar" | "search-bar" | "widget" | "folder-preview";
export type AppSurfaceTone = "auto" | "light" | "dark";

export type RaysOrigin =
    | "top-center"
    | "top-left"
    | "top-right"
    | "right"
    | "left"
    | "bottom-center"
    | "bottom-right"
    | "bottom-left";

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

export interface RaysGlassMaterialConfig {
    raysOrigin: RaysOrigin;
    raysColor: string;
    raysSpeed: number;
    lightSpread: number;
    rayLength: number;
    pulsating: boolean;
    fadeDistance: number;
    saturation: number;
    followMouse: boolean;
    mouseInfluence: number;
    noiseAmount: number;
    distortion: number;
    className: string;
}

export interface AppSurfaceMaterialConfigMap {
    "glass-distortion": DistortionGlassMaterialConfig;
    "glass-rays": RaysGlassMaterialConfig;
}

export const SURFACE_MATERIAL_OPTIONS: readonly AppSurfaceMaterial[] = [
    "glass-distortion",
    "glass-rays",
] as const;

export const RAYS_ORIGIN_OPTIONS: readonly RaysOrigin[] = [
    "top-center",
    "top-left",
    "top-right",
    "right",
    "left",
    "bottom-center",
    "bottom-right",
    "bottom-left",
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
    "glass-rays": {
        raysOrigin: "top-center",
        raysColor: "#ffffff",
        raysSpeed: 1,
        lightSpread: 0.5,
        rayLength: 1.0,
        pulsating: false,
        fadeDistance: 1.0,
        saturation: 1.0,
        followMouse: false,
        mouseInfluence: 0.5,
        noiseAmount: 0.0,
        distortion: 0.0,
        className: "",
    },
};

export function mergeSurfaceMaterialConfig(
    partial?: Partial<{
        "glass-distortion": Partial<DistortionGlassMaterialConfig>;
        "glass-rays": Partial<RaysGlassMaterialConfig>;
    }> | null
): AppSurfaceMaterialConfigMap {
    return {
        "glass-distortion": {
            ...DEFAULT_APP_SURFACE_MATERIAL_CONFIG["glass-distortion"],
            ...(partial?.["glass-distortion"] ?? {}),
        },
        "glass-rays": {
            ...DEFAULT_APP_SURFACE_MATERIAL_CONFIG["glass-rays"],
            ...(partial?.["glass-rays"] ?? {}),
        },
    };
}

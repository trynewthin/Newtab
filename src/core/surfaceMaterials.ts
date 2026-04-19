export type AppSurfaceVariant = "base" | "toolbar" | "search-bar" | "widget" | "folder-preview";
export type AppSurfaceTone = "auto" | "light" | "dark";
export type AppSurfaceMaterial = "mac-frosted" | "mica";

export interface MacFrostedMaterialConfig {
    backgroundOpacity: number;
    saturation: number;
    blur: number;
    borderWidth: number;
    borderOpacity: number;
    highlightOpacity: number;
    shadowOpacity: number;
}

export interface MicaMaterialConfig {
    backgroundOpacity: number;
    saturation: number;
    blur: number;
    borderWidth: number;
    borderOpacity: number;
    tintColor: string;
    tintOpacity: number;
    shadowOpacity: number;
    noiseOpacity: number;
}

export interface AppSurfaceMaterialConfigMap {
    "mac-frosted": MacFrostedMaterialConfig;
    "mica": MicaMaterialConfig;
}

export const DEFAULT_APP_SURFACE_MATERIAL_CONFIG: AppSurfaceMaterialConfigMap = {
    "mac-frosted": {
        backgroundOpacity: 0.36,
        saturation: 1.8,
        blur: 40,
        borderWidth: 0.5,
        borderOpacity: 0.3,
        highlightOpacity: 0.06,
        shadowOpacity: 0.12,
    },
    "mica": {
        backgroundOpacity: 0.68,
        saturation: 1.2,
        blur: 26,
        borderWidth: 0.5,
        borderOpacity: 0.18,
        tintColor: "#b8c4da",
        tintOpacity: 0.2,
        shadowOpacity: 0.12,
        noiseOpacity: 0.05,
    },
};

export function mergeSurfaceMaterialConfig(
    partial?: Partial<{
        "mac-frosted": Partial<MacFrostedMaterialConfig>;
        "mica": Partial<MicaMaterialConfig>;
    }> | null
): AppSurfaceMaterialConfigMap {
    return {
        "mac-frosted": {
            ...DEFAULT_APP_SURFACE_MATERIAL_CONFIG["mac-frosted"],
            ...(partial?.["mac-frosted"] ?? {}),
        },
        "mica": {
            ...DEFAULT_APP_SURFACE_MATERIAL_CONFIG["mica"],
            ...(partial?.["mica"] ?? {}),
        },
    };
}

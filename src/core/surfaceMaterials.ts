export type AppSurfaceVariant = "base" | "toolbar" | "search-bar" | "widget" | "folder-preview";
export type AppSurfaceTone = "auto" | "light" | "dark";

export interface MacFrostedMaterialConfig {
    backgroundOpacity: number;
    saturation: number;
    blur: number;
    borderWidth: number;
    borderOpacity: number;
    highlightOpacity: number;
    shadowOpacity: number;
}

export interface AppSurfaceMaterialConfigMap {
    "mac-frosted": MacFrostedMaterialConfig;
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
};

export function mergeSurfaceMaterialConfig(
    partial?: Partial<{
        "mac-frosted": Partial<MacFrostedMaterialConfig>;
    }> | null
): AppSurfaceMaterialConfigMap {
    return {
        "mac-frosted": {
            ...DEFAULT_APP_SURFACE_MATERIAL_CONFIG["mac-frosted"],
            ...(partial?.["mac-frosted"] ?? {}),
        },
    };
}

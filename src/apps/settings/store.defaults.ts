import {
    DEFAULT_APP_SURFACE_MATERIAL_CONFIG,
    mergeSurfaceMaterialConfig,
} from "@/core/surfaceMaterials";
import {
    DEFAULT_DYNAMIC_BACKGROUND_CONFIG,
    mergeDynamicBackgroundConfig,
} from "@/core/dynamicBackgrounds";
import type { SettingsStateData } from "./store.types";

export function createDefaultSettingsState(): SettingsStateData {
    return {
        primaryColor: "hsl(217 91% 60%)",
        textSurfaceFontPreset: "sans",
        surfaceMaterial: "mac-frosted",
        surfaceTone: "auto",
        surfaceMaterialConfig: mergeSurfaceMaterialConfig(DEFAULT_APP_SURFACE_MATERIAL_CONFIG),
        backgroundConfig: {
            type: "theme",
            value: "color-bends",
        },
        dynamicBackgroundConfig: mergeDynamicBackgroundConfig(DEFAULT_DYNAMIC_BACKGROUND_CONFIG),
        solidColors: [
            "hsl(224 71% 4%)",
            "hsl(0 0% 5%)",
        ],
    };
}

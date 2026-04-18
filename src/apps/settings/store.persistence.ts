import {
    mergeSurfaceMaterialConfig,
    type AppSurfaceMaterial,
    type AppSurfaceMaterialConfigMap,
} from "@/core/surfaceMaterials";
import {
    DYNAMIC_BACKGROUND_IDS,
    isDynamicBackgroundId,
    mergeDynamicBackgroundConfig,
    type DynamicBackgroundConfigMap,
} from "@/core/dynamicBackgrounds";
import type { SettingsState } from "./store.types";

function normalizeBackgroundConfig(
    backgroundConfig: SettingsState["backgroundConfig"]
): SettingsState["backgroundConfig"] {
    if (backgroundConfig.type !== "theme") {
        return backgroundConfig;
    }

    if (isDynamicBackgroundId(backgroundConfig.value)) {
        return backgroundConfig;
    }

    return {
        ...backgroundConfig,
        value: DYNAMIC_BACKGROUND_IDS[0],
    };
}

export function mergePersistedSettings(
    persistedState: unknown,
    currentState: SettingsState
): SettingsState {
    const persisted = (persistedState as Partial<SettingsState> | undefined) ?? {};
    const persistedSurfaceMaterial = persisted.surfaceMaterial as string | undefined;
    const normalizedSurfaceMaterial: AppSurfaceMaterial =
        persistedSurfaceMaterial === "mac-frosted" ||
        persistedSurfaceMaterial === "glass-distortion"
            ? persistedSurfaceMaterial
            : "glass-distortion";

    return {
        ...currentState,
        ...persisted,
        surfaceMaterial: normalizedSurfaceMaterial,
        backgroundConfig: normalizeBackgroundConfig(persisted.backgroundConfig ?? currentState.backgroundConfig),
        surfaceMaterialConfig: mergeSurfaceMaterialConfig(
            (persisted.surfaceMaterialConfig as Partial<AppSurfaceMaterialConfigMap> | undefined) ??
                undefined
        ),
        dynamicBackgroundConfig: mergeDynamicBackgroundConfig(
            (persisted.dynamicBackgroundConfig as Partial<DynamicBackgroundConfigMap> | undefined) ??
                undefined
        ),
    };
}

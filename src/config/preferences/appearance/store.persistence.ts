import {
    DYNAMIC_BACKGROUND_IDS,
    isDynamicBackgroundId,
    mergeDynamicBackgroundConfig,
    type DynamicBackgroundConfigMap,
} from "@/core/dynamicBackgrounds";
import {
    type AppSurfaceMaterial,
    mergeSurfaceMaterialConfig,
    type AppSurfaceMaterialConfigMap,
} from "@/core/surfaceMaterials";
import type { AppearancePreferenceState } from "./store.types";

function normalizeBackgroundConfig(
    backgroundConfig: AppearancePreferenceState["backgroundConfig"]
): AppearancePreferenceState["backgroundConfig"] {
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

export function mergePersistedAppearancePreference(
    persistedState: unknown,
    currentState: AppearancePreferenceState
): AppearancePreferenceState {
    const persisted = (
        persistedState as (Partial<AppearancePreferenceState> & { surfaceMaterial?: unknown }) | undefined
    ) ?? {};
    const persistedAppearance = { ...persisted };
    delete persistedAppearance.surfaceMaterial;
    const surfaceMaterial = persisted.surfaceMaterial;
    const normalizedSurfaceMaterial: AppSurfaceMaterial =
        surfaceMaterial === "mica" || surfaceMaterial === "mac-frosted"
            ? surfaceMaterial
            : currentState.surfaceMaterial;

    return {
        ...currentState,
        ...persistedAppearance,
        surfaceMaterial: normalizedSurfaceMaterial,
        backgroundConfig: normalizeBackgroundConfig(
            persistedAppearance.backgroundConfig ?? currentState.backgroundConfig
        ),
        surfaceMaterialConfig: mergeSurfaceMaterialConfig(
            (persistedAppearance.surfaceMaterialConfig as Partial<AppSurfaceMaterialConfigMap> | undefined) ??
                undefined
        ),
        dynamicBackgroundConfig: mergeDynamicBackgroundConfig(
            (persistedAppearance.dynamicBackgroundConfig as Partial<DynamicBackgroundConfigMap> | undefined) ??
                undefined
        ),
    };
}

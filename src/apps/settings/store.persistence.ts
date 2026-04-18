import {
    mergeSurfaceMaterialConfig,
    type AppSurfaceMaterial,
    type AppSurfaceMaterialConfigMap,
} from "@/core/surfaceMaterials";
import {
    mergeDynamicBackgroundConfig,
    type DynamicBackgroundConfigMap,
} from "@/core/dynamicBackgrounds";
import type { SettingsState } from "./store.types";

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

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

const VALID_BUILTIN_SEARCH_ENGINES = new Set([
    "google",
    "bing",
    "duckduckgo",
    "baidu",
    "yandex",
    "youtube",
    "github",
    "wikipedia",
    "bilibili",
]);

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
    const persistedCustomEngines = (persisted.customSearchEngines as Array<{ value?: string }> | undefined) ?? [];
    const normalizedSearchEngine =
        typeof persisted.searchEngine === "string" &&
        (VALID_BUILTIN_SEARCH_ENGINES.has(persisted.searchEngine) ||
            persistedCustomEngines.some((engine) => engine?.value === persisted.searchEngine))
            ? persisted.searchEngine
            : currentState.searchEngine;

    return {
        ...currentState,
        ...persisted,
        surfaceMaterial: normalizedSurfaceMaterial,
        searchEngine: normalizedSearchEngine,
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

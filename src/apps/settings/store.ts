import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createPersistConfig } from "@/platform/persistence/zustandStorage";
import {
    DEFAULT_DYNAMIC_BACKGROUND_CONFIG,
} from "@/core/dynamicBackgrounds";
import type {
    AppSurfaceMaterial,
    AppSurfaceTone,
    AppSurfaceMaterialConfigMap,
} from "@/core/surfaceMaterials";
import type { DynamicBackgroundId, DynamicBackgroundConfigMap } from "@/core/dynamicBackgrounds";
import type { TextSurfaceFontPreset } from "@/core/textSurface";
import type {
    CustomSearchEngine,
    SettingsState,
    ThemeMode,
} from "./store.types";
import { createDefaultSettingsState } from "./store.defaults";
import { mergePersistedSettings } from "./store.persistence";

const defaultState = createDefaultSettingsState();

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            ...defaultState,

            setTheme: (theme: ThemeMode) => set({ theme }),
            setPrimaryColor: (primaryColor: string) => set({ primaryColor }),
            setTextSurfaceFontPreset: (textSurfaceFontPreset: TextSurfaceFontPreset) =>
                set({ textSurfaceFontPreset }),
            setSurfaceMaterial: (surfaceMaterial: AppSurfaceMaterial) => set({ surfaceMaterial }),
            setSurfaceTone: (surfaceTone: AppSurfaceTone) => set({ surfaceTone }),
            updateSurfaceMaterialConfig: <T extends AppSurfaceMaterial>(
                material: T,
                config: Partial<AppSurfaceMaterialConfigMap[T]>
            ) =>
                set((state: SettingsState) => ({
                    surfaceMaterialConfig: {
                        ...state.surfaceMaterialConfig,
                        [material]: {
                            ...state.surfaceMaterialConfig[material],
                            ...config,
                        },
                    } as AppSurfaceMaterialConfigMap,
                })),

            setBackgroundConfig: (config: Partial<SettingsState["backgroundConfig"]>) =>
                set((state: SettingsState) => ({
                    backgroundConfig: { ...state.backgroundConfig, ...config },
                })),
            updateDynamicBackgroundConfig: <T extends DynamicBackgroundId>(
                backgroundId: T,
                config: Partial<DynamicBackgroundConfigMap[T]>
            ) =>
                set((state: SettingsState) => ({
                    dynamicBackgroundConfig: {
                        ...state.dynamicBackgroundConfig,
                        [backgroundId]: {
                            ...state.dynamicBackgroundConfig[backgroundId],
                            ...config,
                        },
                    } as DynamicBackgroundConfigMap,
                })),
            resetDynamicBackgroundConfig: (backgroundId: DynamicBackgroundId) =>
                set((state: SettingsState) => ({
                    dynamicBackgroundConfig: {
                        ...state.dynamicBackgroundConfig,
                        [backgroundId]: DEFAULT_DYNAMIC_BACKGROUND_CONFIG[backgroundId],
                    },
                })),

            addSolidColor: (color: string) =>
                set((state: SettingsState) => ({
                    solidColors: [...state.solidColors, color],
                })),
            removeSolidColor: (color: string) =>
                set((state: SettingsState) => ({
                    solidColors: state.solidColors.filter((entry: string) => entry !== color),
                })),

            setFirstRun: (isFirstRun: boolean) => set({ isFirstRun }),
            setSearchEngine: (searchEngine: string) => set({ searchEngine }),

            addCustomSearchEngine: (engine: CustomSearchEngine) =>
                set((state: SettingsState) => ({
                    customSearchEngines: [...state.customSearchEngines, engine],
                })),
            removeCustomSearchEngine: (value: string) =>
                set((state: SettingsState) => ({
                    customSearchEngines: state.customSearchEngines.filter(
                        (engine: CustomSearchEngine) => engine.value !== value
                    ),
                    searchEngine: state.searchEngine === value ? "google" : state.searchEngine,
                })),
            updateCustomSearchEngine: (
                value: string,
                engine: Partial<Pick<CustomSearchEngine, "name" | "url" | "icon">>
            ) =>
                set((state: SettingsState) => ({
                    customSearchEngines: state.customSearchEngines.map((entry: CustomSearchEngine) =>
                        entry.value === value ? { ...entry, ...engine } : entry
                    ),
                })),
        }),
        createPersistConfig("app-settings", {
            merge: mergePersistedSettings,
        })
    )
);

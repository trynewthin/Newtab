import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createPersistConfig } from '@/platform/state/core/storage';
import type { BackgroundConfig } from '@/platform/state/core/types';
import {
    type AppSurfaceMaterial,
    type AppSurfaceTone,
    type AppSurfaceMaterialConfigMap,
    DEFAULT_APP_SURFACE_MATERIAL_CONFIG,
    mergeSurfaceMaterialConfig,
} from '@/platform/core/surfaceMaterials';
import {
    type DynamicBackgroundId,
    type DynamicBackgroundConfigMap,
    DEFAULT_DYNAMIC_BACKGROUND_CONFIG,
    mergeDynamicBackgroundConfig,
} from '@/platform/core/dynamicBackgrounds';
import type { TextSurfaceFontPreset } from '@/platform/core/textSurface';

interface SettingsState {
    // Theme & Appearance
    theme: 'light' | 'dark' | 'system';
    setTheme: (theme: 'light' | 'dark' | 'system') => void;

    primaryColor: string;
    setPrimaryColor: (color: string) => void;
    textSurfaceFontPreset: TextSurfaceFontPreset;
    setTextSurfaceFontPreset: (preset: TextSurfaceFontPreset) => void;

    surfaceMaterial: AppSurfaceMaterial;
    setSurfaceMaterial: (material: AppSurfaceMaterial) => void;
    surfaceTone: AppSurfaceTone;
    setSurfaceTone: (tone: AppSurfaceTone) => void;
    surfaceMaterialConfig: AppSurfaceMaterialConfigMap;
    updateSurfaceMaterialConfig: <T extends AppSurfaceMaterial>(
        material: T,
        config: Partial<AppSurfaceMaterialConfigMap[T]>
    ) => void;

    backgroundConfig: BackgroundConfig;
    setBackgroundConfig: (config: Partial<BackgroundConfig>) => void;
    dynamicBackgroundConfig: DynamicBackgroundConfigMap;
    updateDynamicBackgroundConfig: <T extends DynamicBackgroundId>(
        backgroundId: T,
        config: Partial<DynamicBackgroundConfigMap[T]>
    ) => void;
    resetDynamicBackgroundConfig: (backgroundId: DynamicBackgroundId) => void;

    solidColors: string[];
    addSolidColor: (color: string) => void;
    removeSolidColor: (color: string) => void;

    // General Config
    isFirstRun: boolean;
    setFirstRun: (status: boolean) => void;

    searchEngine: string;
    setSearchEngine: (engine: string) => void;

    customSearchEngines: Array<{ name: string; value: string; url: string; icon?: string }>;
    addCustomSearchEngine: (engine: { name: string; value: string; url: string; icon?: string }) => void;
    removeCustomSearchEngine: (value: string) => void;
    updateCustomSearchEngine: (value: string, engine: Partial<{ name: string; url: string; icon?: string }>) => void;

}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            theme: 'light',
            setTheme: (theme: 'light' | 'dark' | 'system') => set({ theme }),

            primaryColor: 'hsl(217 91% 60%)', // Blue as default
            setPrimaryColor: (color: string) => set({ primaryColor: color }),
            textSurfaceFontPreset: 'sans',
            setTextSurfaceFontPreset: (preset: TextSurfaceFontPreset) => set({ textSurfaceFontPreset: preset }),

            surfaceMaterial: 'glass-distortion',
            setSurfaceMaterial: (material: AppSurfaceMaterial) => set({ surfaceMaterial: material }),
            surfaceTone: 'auto',
            setSurfaceTone: (tone: AppSurfaceTone) => set({ surfaceTone: tone }),
            surfaceMaterialConfig: mergeSurfaceMaterialConfig(DEFAULT_APP_SURFACE_MATERIAL_CONFIG),
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

            backgroundConfig: {
                type: 'gradient',
                value: 'linear-gradient(to bottom right, #1e3a8a, #06b6d4)', // Ocean as default
            },
            setBackgroundConfig: (config: Partial<BackgroundConfig>) => set((state: SettingsState) => ({
                backgroundConfig: { ...state.backgroundConfig, ...config }
            })),
            dynamicBackgroundConfig: mergeDynamicBackgroundConfig(DEFAULT_DYNAMIC_BACKGROUND_CONFIG),
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

            solidColors: [
                'hsl(224 71% 4%)', // Deep Blue/Black
                'hsl(0 0% 5%)',    // Minimal Black
            ],
            addSolidColor: (color: string) => set((state: SettingsState) => ({
                solidColors: [...state.solidColors, color]
            })),
            removeSolidColor: (color: string) => set((state: SettingsState) => ({
                solidColors: state.solidColors.filter((c: string) => c !== color)
            })),

            isFirstRun: true,
            setFirstRun: (status: boolean) => set({ isFirstRun: status }),

            searchEngine: 'google',
            setSearchEngine: (engine: string) => set({ searchEngine: engine }),

            customSearchEngines: [],
            addCustomSearchEngine: (engine: { name: string; value: string; url: string; icon?: string }) => set((state: SettingsState) => ({
                customSearchEngines: [...state.customSearchEngines, engine]
            })),
            removeCustomSearchEngine: (value: string) => set((state: SettingsState) => ({
                customSearchEngines: state.customSearchEngines.filter((e) => e.value !== value),
                // If the deleted engine was the selected one, fallback to google
                searchEngine: state.searchEngine === value ? 'google' : state.searchEngine
            })),
            updateCustomSearchEngine: (value: string, engine: Partial<{ name: string; url: string; icon?: string }>) => set((state: SettingsState) => ({
                customSearchEngines: state.customSearchEngines.map((e) =>
                    e.value === value ? { ...e, ...engine } : e
                )
            })),

        }),
        createPersistConfig('app-settings', {
            merge: (persistedState: unknown, currentState: SettingsState) => {
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
                        (persisted.surfaceMaterialConfig as Partial<AppSurfaceMaterialConfigMap> | undefined) ?? undefined
                    ),
                    dynamicBackgroundConfig: mergeDynamicBackgroundConfig(
                        (persisted.dynamicBackgroundConfig as Partial<DynamicBackgroundConfigMap> | undefined) ?? undefined
                    ),
                };
            },
        })
    )
);


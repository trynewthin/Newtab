import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
    DEFAULT_DYNAMIC_BACKGROUND_CONFIG,
    type DynamicBackgroundConfigMap,
    type DynamicBackgroundId,
} from "@/core/dynamicBackgrounds";
import type {
    AppSurfaceMaterialConfigMap,
    AppSurfaceTone,
} from "@/core/surfaceMaterials";
import type { TextSurfaceFontPreset } from "@/core/textSurface";
import { storageRegistry } from "@/platform/persistence/registry";
import { createPersistConfig } from "@/platform/persistence/zustandStorage";
import { createDefaultAppearancePreferenceState } from "./store.defaults";
import { mergePersistedAppearancePreference } from "./store.persistence";
import { APPEARANCE_PREFERENCE_STORAGE_KEY } from "./shared";
import type { AppearancePreferenceState } from "./store.types";

const defaultState = createDefaultAppearancePreferenceState();

export const useAppearancePreferenceStore = create<AppearancePreferenceState>()(
    persist(
        (set) => ({
            ...defaultState,
            setPrimaryColor: (primaryColor: string) => set({ primaryColor }),
            setTextSurfaceFontPreset: (textSurfaceFontPreset: TextSurfaceFontPreset) =>
                set({ textSurfaceFontPreset }),
            setIconLabelHidden: (iconLabelHidden: boolean) => set({ iconLabelHidden }),
            setSurfaceTone: (surfaceTone: AppSurfaceTone) => set({ surfaceTone }),
            updateSurfaceMaterialConfig: <T extends keyof AppSurfaceMaterialConfigMap>(
                material: T,
                config: Partial<AppSurfaceMaterialConfigMap[T]>
            ) =>
                set((state: AppearancePreferenceState) => ({
                    surfaceMaterialConfig: {
                        ...state.surfaceMaterialConfig,
                        [material]: {
                            ...state.surfaceMaterialConfig[material],
                            ...config,
                        },
                    } as AppSurfaceMaterialConfigMap,
                })),
            setBackgroundConfig: (config: Partial<AppearancePreferenceState["backgroundConfig"]>) =>
                set((state: AppearancePreferenceState) => ({
                    backgroundConfig: { ...state.backgroundConfig, ...config },
                })),
            updateDynamicBackgroundConfig: <T extends DynamicBackgroundId>(
                backgroundId: T,
                config: Partial<DynamicBackgroundConfigMap[T]>
            ) =>
                set((state: AppearancePreferenceState) => ({
                    dynamicBackgroundConfig: {
                        ...state.dynamicBackgroundConfig,
                        [backgroundId]: {
                            ...state.dynamicBackgroundConfig[backgroundId],
                            ...config,
                        },
                    } as DynamicBackgroundConfigMap,
                })),
            resetDynamicBackgroundConfig: (backgroundId: DynamicBackgroundId) =>
                set((state: AppearancePreferenceState) => ({
                    dynamicBackgroundConfig: {
                        ...state.dynamicBackgroundConfig,
                        [backgroundId]: DEFAULT_DYNAMIC_BACKGROUND_CONFIG[backgroundId],
                    },
                })),
            addSolidColor: (color: string) =>
                set((state: AppearancePreferenceState) => ({
                    solidColors: [...state.solidColors, color],
                })),
            removeSolidColor: (color: string) =>
                set((state: AppearancePreferenceState) => ({
                    solidColors: state.solidColors.filter((entry: string) => entry !== color),
                })),
        }),
        createPersistConfig<AppearancePreferenceState>(APPEARANCE_PREFERENCE_STORAGE_KEY, {
            merge: mergePersistedAppearancePreference,
        })
    )
);

storageRegistry.registerRehydrator(
    APPEARANCE_PREFERENCE_STORAGE_KEY,
    () => useAppearancePreferenceStore.persist.rehydrate()
);

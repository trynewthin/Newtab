import type { BackgroundConfig } from "@/shared/types/background";
import type {
    AppSurfaceMaterial,
    AppSurfaceMaterialConfigMap,
    AppSurfaceTone,
} from "@/core/surfaceMaterials";
import type {
    DynamicBackgroundConfigMap,
    DynamicBackgroundId,
} from "@/core/dynamicBackgrounds";
import type { TextSurfaceFontPreset } from "@/core/textSurface";
import type { IconCornerRadiusPreset } from "./iconCornerRadius";

export interface AppearancePreferenceData {
    primaryColor: string;
    textSurfaceFontPreset: TextSurfaceFontPreset;
    iconLabelHidden: boolean;
    iconCornerRadius: IconCornerRadiusPreset;
    surfaceMaterial: AppSurfaceMaterial;
    surfaceTone: AppSurfaceTone;
    surfaceMaterialConfig: AppSurfaceMaterialConfigMap;
    backgroundConfig: BackgroundConfig;
    dynamicBackgroundConfig: DynamicBackgroundConfigMap;
    solidColors: string[];
}

export interface AppearancePreferenceActions {
    setPrimaryColor: (color: string) => void;
    setTextSurfaceFontPreset: (preset: TextSurfaceFontPreset) => void;
    setIconLabelHidden: (hidden: boolean) => void;
    setIconCornerRadius: (radius: IconCornerRadiusPreset) => void;
    setSurfaceMaterial: (material: AppSurfaceMaterial) => void;
    setSurfaceTone: (tone: AppSurfaceTone) => void;
    updateSurfaceMaterialConfig: <T extends keyof AppSurfaceMaterialConfigMap>(
        material: T,
        config: Partial<AppSurfaceMaterialConfigMap[T]>
    ) => void;
    setBackgroundConfig: (config: Partial<BackgroundConfig>) => void;
    updateDynamicBackgroundConfig: <T extends DynamicBackgroundId>(
        backgroundId: T,
        config: Partial<DynamicBackgroundConfigMap[T]>
    ) => void;
    resetDynamicBackgroundConfig: (backgroundId: DynamicBackgroundId) => void;
    addSolidColor: (color: string) => void;
    removeSolidColor: (color: string) => void;
}

export type AppearancePreferenceState = AppearancePreferenceData & AppearancePreferenceActions;

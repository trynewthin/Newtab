import type { BackgroundConfig } from "@/shared/types/background";
import type {
    AppSurfaceMaterial,
    AppSurfaceTone,
    AppSurfaceMaterialConfigMap,
} from "@/core/surfaceMaterials";
import type {
    DynamicBackgroundId,
    DynamicBackgroundConfigMap,
} from "@/core/dynamicBackgrounds";
import type { TextSurfaceFontPreset } from "@/core/textSurface";

export interface SettingsStateData {
    primaryColor: string;
    textSurfaceFontPreset: TextSurfaceFontPreset;
    surfaceMaterial: AppSurfaceMaterial;
    surfaceTone: AppSurfaceTone;
    surfaceMaterialConfig: AppSurfaceMaterialConfigMap;
    backgroundConfig: BackgroundConfig;
    dynamicBackgroundConfig: DynamicBackgroundConfigMap;
    solidColors: string[];
}

export interface SettingsStateActions {
    setPrimaryColor: (color: string) => void;
    setTextSurfaceFontPreset: (preset: TextSurfaceFontPreset) => void;
    setSurfaceMaterial: (material: AppSurfaceMaterial) => void;
    setSurfaceTone: (tone: AppSurfaceTone) => void;
    updateSurfaceMaterialConfig: <T extends AppSurfaceMaterial>(
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

export type SettingsState = SettingsStateData & SettingsStateActions;

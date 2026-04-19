import { useTranslation } from "react-i18next";
import { useAppearancePreferenceStore } from "@/config";
import {
    SETTINGS_ACTION_BUTTON_CLASS,
    SETTINGS_FIELD_CLASS,
    SettingsItem,
    SettingsSection,
} from "@/apps/settings/components/SettingComponents";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
    type AppSurfaceMaterial,
    DEFAULT_APP_SURFACE_MATERIAL_CONFIG,
    mergeSurfaceMaterialConfig,
    type AppSurfaceTone,
} from "@/core/surfaceMaterials";
import { parseColor } from "@/shared/utils";
import {
    isDynamicBackgroundId,
} from "@/core/dynamicBackgrounds";
import { DynamicBackgroundEffect } from "@/platform/ui/effects";
import { AppSurface } from "@/platform/ui";

function NumberSlider({
    value,
    min,
    max,
    step,
    onChange,
}: {
    value: number;
    min: number;
    max: number;
    step: number;
    onChange: (value: number) => void;
}) {
    return (
        <div className="flex w-[220px] items-center gap-2">
            <Slider
                value={[value]}
                min={min}
                max={max}
                step={step}
                onValueChange={(next) => onChange(next[0] ?? value)}
            />
            <span className="w-12 text-right text-[11px] text-muted-foreground">
                {value.toFixed(step >= 1 ? 0 : 2)}
            </span>
        </div>
    );
}

function MaterialPreview() {
    const { backgroundConfig, dynamicBackgroundConfig } = useAppearancePreferenceStore();

    const activeThemeId =
        backgroundConfig.type === "theme" && isDynamicBackgroundId(backgroundConfig.value)
            ? backgroundConfig.value
            : null;

    const getStaticBackground = (): React.CSSProperties => {
        if (backgroundConfig.type === "solid") return { backgroundColor: backgroundConfig.value };
        if (backgroundConfig.type === "gradient") return { backgroundImage: backgroundConfig.value };
        if (backgroundConfig.type === "image") return { backgroundImage: `url(${backgroundConfig.value})`, backgroundSize: "cover", backgroundPosition: "center" };
        return { backgroundImage: "radial-gradient(120% 120% at 50% 0%, #0b1220 0%, #050b1a 55%, #030712 100%)" };
    };

    return (
        <div className="rounded-2xl p-2.5 shadow-[0_4px_12px_rgba(0,0,0,0.12),0_2px_6px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_12px_rgba(255,255,255,0.08),0_2px_6px_rgba(255,255,255,0.05)]">
            <div className="relative h-56 overflow-hidden rounded-xl md:h-64">
                <div className="absolute inset-0 pointer-events-none" style={getStaticBackground()}>
                    <DynamicBackgroundEffect
                        backgroundId={activeThemeId}
                        configMap={dynamicBackgroundConfig}
                    />
                </div>
                <div className="absolute inset-0 flex items-center justify-center p-6">
                    <div className="relative h-28 w-full max-w-[320px] overflow-hidden rounded-[24px] shadow-[0_18px_45px_rgba(0,0,0,0.35)] md:h-32 md:max-w-[360px]">
                        <div className="absolute inset-0 z-0 pointer-events-none">
                            <AppSurface
                                variant="widget"
                                hideSurfaceBorder={false}
                                width="100%"
                                height="100%"
                                borderRadius={24}
                                style={{ outline: "none", boxShadow: "none" }}
                                className="h-full w-full rounded-[24px]"
                            />
                        </div>
                        <div className="relative z-10 flex h-full items-center gap-3 px-5">
                            <div className="h-9 w-9 shrink-0 rounded-lg bg-foreground/10" />
                            <div className="flex flex-col gap-1.5">
                                <div className="h-2.5 w-32 rounded-full bg-foreground/15" />
                                <div className="h-2 w-24 rounded-full bg-foreground/10" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function CompactColorPicker({
    value,
    onChange,
}: {
    value: string;
    onChange: (value: string) => void;
}) {
    const { hex } = parseColor(value);

    return (
        <div className="flex w-[220px] items-center gap-3">
            <div className="relative h-8 w-8 overflow-hidden rounded-full border border-border shadow-sm ring-1 ring-border/20">
                <input
                    type="color"
                    value={hex}
                    onChange={(event) => onChange(event.target.value)}
                    className="absolute inset-[-4px] h-[200%] w-[200%] cursor-pointer p-0 m-0"
                />
            </div>
            <span className="font-mono text-[11px] text-muted-foreground">
                {hex}
            </span>
        </div>
    );
}

export function SurfaceMaterialSettings() {
    const { t } = useTranslation();
    const {
        surfaceTone,
        setSurfaceTone,
        surfaceMaterial,
        setSurfaceMaterial,
        surfaceMaterialConfig,
        updateSurfaceMaterialConfig,
    } = useAppearancePreferenceStore();

    const materialConfigMap = mergeSurfaceMaterialConfig(surfaceMaterialConfig);
    const frostedConfig = materialConfigMap["mac-frosted"];
    const micaConfig = materialConfigMap["mica"];

    const updateFrosted = (patch: Partial<typeof frostedConfig>) => {
        updateSurfaceMaterialConfig("mac-frosted", patch);
    };

    const updateMica = (patch: Partial<typeof micaConfig>) => {
        updateSurfaceMaterialConfig("mica", patch);
    };

    const resetCurrentMaterial = () => {
        updateSurfaceMaterialConfig(surfaceMaterial, DEFAULT_APP_SURFACE_MATERIAL_CONFIG[surfaceMaterial]);
    };

    const toneLabelMap: Record<AppSurfaceTone, string> = {
        auto: t("surface_tone_auto"),
        light: t("surface_tone_light"),
        dark: t("surface_tone_dark"),
    };
    const materialLabelMap: Record<AppSurfaceMaterial, string> = {
        "mac-frosted": t("surface_material_mac_frosted"),
        "mica": t("surface_material_mica"),
    };

    return (
        <SettingsSection title={t("surface_materials")}>
            <MaterialPreview />

            <SettingsItem label={t("surface_material_tone")}>
                <Select value={surfaceTone} onValueChange={(value) => setSurfaceTone(value as AppSurfaceTone)}>
                    <SelectTrigger className={`${SETTINGS_FIELD_CLASS} w-[220px]`}>
                        <SelectValue>{toneLabelMap[surfaceTone]}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="auto">{t("surface_tone_auto")}</SelectItem>
                        <SelectItem value="light">{t("surface_tone_light")}</SelectItem>
                        <SelectItem value="dark">{t("surface_tone_dark")}</SelectItem>
                    </SelectContent>
                </Select>
            </SettingsItem>

            <SettingsItem label={t("surface_material_type")}>
                <Select value={surfaceMaterial} onValueChange={(value) => setSurfaceMaterial(value as AppSurfaceMaterial)}>
                    <SelectTrigger className={`${SETTINGS_FIELD_CLASS} w-[220px]`}>
                        <SelectValue>{materialLabelMap[surfaceMaterial]}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="mac-frosted">{t("surface_material_mac_frosted")}</SelectItem>
                        <SelectItem value="mica">{t("surface_material_mica")}</SelectItem>
                    </SelectContent>
                </Select>
            </SettingsItem>

            <SettingsItem label={t("surface_material_reset_label")}>
                <button
                    type="button"
                    onClick={resetCurrentMaterial}
                    className={SETTINGS_ACTION_BUTTON_CLASS}
                >
                    {t("surface_material_reset_button")}
                </button>
            </SettingsItem>

            {surfaceMaterial === "mac-frosted" ? (
                <div className="space-y-3.5">
                    <SettingsItem label={t("surface_field_background_opacity")}>
                        <NumberSlider value={frostedConfig.backgroundOpacity} min={0} max={1} step={0.01} onChange={(v) => updateFrosted({ backgroundOpacity: v })} />
                    </SettingsItem>
                    <SettingsItem label={t("surface_field_saturation")}>
                        <NumberSlider value={frostedConfig.saturation} min={0} max={3} step={0.01} onChange={(v) => updateFrosted({ saturation: v })} />
                    </SettingsItem>
                    <SettingsItem label={t("surface_field_blur")}>
                        <NumberSlider value={frostedConfig.blur} min={0} max={80} step={1} onChange={(v) => updateFrosted({ blur: v })} />
                    </SettingsItem>
                    <SettingsItem label={t("surface_field_border_width")}>
                        <NumberSlider value={frostedConfig.borderWidth} min={0} max={3} step={0.1} onChange={(v) => updateFrosted({ borderWidth: v })} />
                    </SettingsItem>
                    <SettingsItem label={t("surface_field_border_opacity")}>
                        <NumberSlider value={frostedConfig.borderOpacity} min={0} max={1} step={0.01} onChange={(v) => updateFrosted({ borderOpacity: v })} />
                    </SettingsItem>
                    <SettingsItem label={t("surface_field_highlight_opacity")}>
                        <NumberSlider value={frostedConfig.highlightOpacity} min={0} max={1} step={0.01} onChange={(v) => updateFrosted({ highlightOpacity: v })} />
                    </SettingsItem>
                    <SettingsItem label={t("surface_field_shadow_opacity")}>
                        <NumberSlider value={frostedConfig.shadowOpacity} min={0} max={1} step={0.01} onChange={(v) => updateFrosted({ shadowOpacity: v })} />
                    </SettingsItem>
                </div>
            ) : (
                <div className="space-y-3.5">
                    <SettingsItem label={t("surface_field_background_opacity")}>
                        <NumberSlider value={micaConfig.backgroundOpacity} min={0} max={1} step={0.01} onChange={(v) => updateMica({ backgroundOpacity: v })} />
                    </SettingsItem>
                    <SettingsItem label={t("surface_field_saturation")}>
                        <NumberSlider value={micaConfig.saturation} min={0} max={3} step={0.01} onChange={(v) => updateMica({ saturation: v })} />
                    </SettingsItem>
                    <SettingsItem label={t("surface_field_blur")}>
                        <NumberSlider value={micaConfig.blur} min={0} max={80} step={1} onChange={(v) => updateMica({ blur: v })} />
                    </SettingsItem>
                    <SettingsItem label={t("surface_field_border_width")}>
                        <NumberSlider value={micaConfig.borderWidth} min={0} max={3} step={0.1} onChange={(v) => updateMica({ borderWidth: v })} />
                    </SettingsItem>
                    <SettingsItem label={t("surface_field_border_opacity")}>
                        <NumberSlider value={micaConfig.borderOpacity} min={0} max={1} step={0.01} onChange={(v) => updateMica({ borderOpacity: v })} />
                    </SettingsItem>
                    <SettingsItem label={t("surface_field_tint_color")}>
                        <CompactColorPicker value={micaConfig.tintColor} onChange={(value) => updateMica({ tintColor: value })} />
                    </SettingsItem>
                    <SettingsItem label={t("surface_field_tint_opacity")}>
                        <NumberSlider value={micaConfig.tintOpacity} min={0} max={1} step={0.01} onChange={(v) => updateMica({ tintOpacity: v })} />
                    </SettingsItem>
                    <SettingsItem label={t("surface_field_noise_opacity")}>
                        <NumberSlider value={micaConfig.noiseOpacity} min={0} max={0.2} step={0.01} onChange={(v) => updateMica({ noiseOpacity: v })} />
                    </SettingsItem>
                    <SettingsItem label={t("surface_field_shadow_opacity")}>
                        <NumberSlider value={micaConfig.shadowOpacity} min={0} max={1} step={0.01} onChange={(v) => updateMica({ shadowOpacity: v })} />
                    </SettingsItem>
                </div>
            )}
        </SettingsSection>
    );
}

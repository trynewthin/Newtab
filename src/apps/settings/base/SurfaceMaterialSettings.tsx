import { useTranslation } from "react-i18next";
import { Sparkles } from "lucide-react";
import { useSettingsStore } from "@/apps/settings/store";
import { SettingsItem, SettingsSection } from "@/apps/settings/base/SettingComponents";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/platform/shared/ui/select";
import { Slider } from "@/platform/shared/ui/slider";
import {
    DEFAULT_APP_SURFACE_MATERIAL_CONFIG,
    mergeSurfaceMaterialConfig,
    type AppSurfaceMaterial,
    type AppSurfaceTone,
    type DistortionGlassMaterialConfig,
    type FluidGlassMaterialConfig,
} from "@/platform/core/surfaceMaterials";

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

export function SurfaceMaterialSettings() {
    const { t } = useTranslation();
    const {
        surfaceMaterial,
        setSurfaceMaterial,
        surfaceTone,
        setSurfaceTone,
        surfaceMaterialConfig,
        updateSurfaceMaterialConfig,
    } = useSettingsStore();

    const normalizedConfig = mergeSurfaceMaterialConfig(surfaceMaterialConfig);
    const distortionConfig = normalizedConfig["glass-distortion"];
    const frostedConfig = normalizedConfig["mac-frosted"];
    const fluidConfig = normalizedConfig["fluid-glass"];

    const updateDistortion = (patch: Partial<DistortionGlassMaterialConfig>) => {
        updateSurfaceMaterialConfig("glass-distortion", patch);
    };

    const updateFrosted = (patch: Partial<typeof frostedConfig>) => {
        updateSurfaceMaterialConfig("mac-frosted", patch);
    };

    const updateFluid = (patch: Partial<FluidGlassMaterialConfig>) => {
        updateSurfaceMaterialConfig("fluid-glass", patch);
    };

    const resetCurrentMaterial = () => {
        if (surfaceMaterial === "glass-distortion") {
            updateSurfaceMaterialConfig("glass-distortion", DEFAULT_APP_SURFACE_MATERIAL_CONFIG["glass-distortion"]);
            return;
        }
        if (surfaceMaterial === "mac-frosted") {
            updateSurfaceMaterialConfig("mac-frosted", DEFAULT_APP_SURFACE_MATERIAL_CONFIG["mac-frosted"]);
            return;
        }
        updateSurfaceMaterialConfig("fluid-glass", DEFAULT_APP_SURFACE_MATERIAL_CONFIG["fluid-glass"]);
    };

    const materialLabelMap: Record<AppSurfaceMaterial, string> = {
        "glass-distortion": t("surface_material_glass_distortion"),
        "mac-frosted": t("surface_material_mac_frosted"),
        "fluid-glass": t("surface_material_fluid_glass"),
    };

    const toneLabelMap: Record<AppSurfaceTone, string> = {
        auto: t("surface_tone_auto"),
        light: t("surface_tone_light"),
        dark: t("surface_tone_dark"),
    };

    return (
        <SettingsSection
            icon={Sparkles}
            iconColor="text-cyan-500"
            title={t("surface_materials")}
            description={t("surface_materials_desc")}
        >
            <SettingsItem label={t("surface_material_type")}>
                <Select value={surfaceMaterial} onValueChange={(value) => setSurfaceMaterial(value as AppSurfaceMaterial)}>
                    <SelectTrigger className="h-9 w-[220px] rounded-xl border-border/70 bg-background/85">
                        <SelectValue>{materialLabelMap[surfaceMaterial]}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="glass-distortion">{t("surface_material_glass_distortion")}</SelectItem>
                        <SelectItem value="mac-frosted">{t("surface_material_mac_frosted")}</SelectItem>
                        <SelectItem value="fluid-glass">{t("surface_material_fluid_glass")}</SelectItem>
                    </SelectContent>
                </Select>
            </SettingsItem>

            <SettingsItem label={t("surface_material_tone")}>
                <Select value={surfaceTone} onValueChange={(value) => setSurfaceTone(value as AppSurfaceTone)}>
                    <SelectTrigger className="h-9 w-[220px] rounded-xl border-border/70 bg-background/85">
                        <SelectValue>{toneLabelMap[surfaceTone]}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="auto">{t("surface_tone_auto")}</SelectItem>
                        <SelectItem value="light">{t("surface_tone_light")}</SelectItem>
                        <SelectItem value="dark">{t("surface_tone_dark")}</SelectItem>
                    </SelectContent>
                </Select>
            </SettingsItem>

            <SettingsItem label={t("surface_material_reset_label")}>
                <button
                    type="button"
                    onClick={resetCurrentMaterial}
                    className="h-9 rounded-xl border border-border/70 px-3 text-xs font-semibold text-foreground/85 transition-colors hover:bg-foreground/8"
                >
                    {t("surface_material_reset_button")}
                </button>
            </SettingsItem>

            <div className="modal-minimal-divider" />

            {surfaceMaterial === "glass-distortion" ? (
                <div className="space-y-2.5">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/80">
                        {t("surface_material_customize_distortion")}
                    </div>

                    <SettingsItem label={t("surface_field_background_opacity")}>
                        <NumberSlider value={distortionConfig.backgroundOpacity} min={0} max={1} step={0.01} onChange={(v) => updateDistortion({ backgroundOpacity: v })} />
                    </SettingsItem>
                    <SettingsItem label={t("surface_field_saturation")}>
                        <NumberSlider value={distortionConfig.saturation} min={0} max={2} step={0.01} onChange={(v) => updateDistortion({ saturation: v })} />
                    </SettingsItem>
                    <SettingsItem label={t("surface_field_brightness")}>
                        <NumberSlider value={distortionConfig.brightness} min={0} max={100} step={1} onChange={(v) => updateDistortion({ brightness: v })} />
                    </SettingsItem>
                    <SettingsItem label={t("surface_field_opacity")}>
                        <NumberSlider value={distortionConfig.opacity} min={0} max={1} step={0.01} onChange={(v) => updateDistortion({ opacity: v })} />
                    </SettingsItem>
                    <SettingsItem label={t("surface_field_blur")}>
                        <NumberSlider value={distortionConfig.blur} min={0} max={30} step={0.1} onChange={(v) => updateDistortion({ blur: v })} />
                    </SettingsItem>
                    <SettingsItem label={t("surface_field_displace")}>
                        <NumberSlider value={distortionConfig.displace} min={0} max={12} step={0.1} onChange={(v) => updateDistortion({ displace: v })} />
                    </SettingsItem>
                    <SettingsItem label={t("surface_field_distortion_scale")}>
                        <NumberSlider value={distortionConfig.distortionScale} min={-320} max={0} step={1} onChange={(v) => updateDistortion({ distortionScale: v })} />
                    </SettingsItem>
                    <SettingsItem label={t("surface_field_red_offset")}>
                        <NumberSlider value={distortionConfig.redOffset} min={-60} max={60} step={1} onChange={(v) => updateDistortion({ redOffset: v })} />
                    </SettingsItem>
                    <SettingsItem label={t("surface_field_green_offset")}>
                        <NumberSlider value={distortionConfig.greenOffset} min={-60} max={60} step={1} onChange={(v) => updateDistortion({ greenOffset: v })} />
                    </SettingsItem>
                    <SettingsItem label={t("surface_field_blue_offset")}>
                        <NumberSlider value={distortionConfig.blueOffset} min={-60} max={60} step={1} onChange={(v) => updateDistortion({ blueOffset: v })} />
                    </SettingsItem>
                    <SettingsItem label={t("surface_field_border_width")}>
                        <NumberSlider value={distortionConfig.borderWidth} min={0} max={0.25} step={0.01} onChange={(v) => updateDistortion({ borderWidth: v })} />
                    </SettingsItem>
                    <SettingsItem label={t("surface_field_blend_mode")}>
                        <Select
                            value={distortionConfig.mixBlendMode}
                            onValueChange={(value) => updateDistortion({ mixBlendMode: value as DistortionGlassMaterialConfig["mixBlendMode"] })}
                        >
                            <SelectTrigger className="h-9 w-[220px] rounded-xl border-border/70 bg-background/85">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="screen">screen</SelectItem>
                                <SelectItem value="soft-light">soft-light</SelectItem>
                                <SelectItem value="overlay">overlay</SelectItem>
                                <SelectItem value="difference">difference</SelectItem>
                                <SelectItem value="normal">normal</SelectItem>
                            </SelectContent>
                        </Select>
                    </SettingsItem>
                </div>
            ) : surfaceMaterial === "mac-frosted" ? (
                <div className="space-y-2.5">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/80">
                        {t("surface_material_customize_frosted")}
                    </div>

                    <SettingsItem label={t("surface_field_background_opacity")}>
                        <NumberSlider value={frostedConfig.backgroundOpacity} min={0} max={1} step={0.01} onChange={(v) => updateFrosted({ backgroundOpacity: v })} />
                    </SettingsItem>
                    <SettingsItem label={t("surface_field_saturation")}>
                        <NumberSlider value={frostedConfig.saturation} min={0} max={2} step={0.01} onChange={(v) => updateFrosted({ saturation: v })} />
                    </SettingsItem>
                    <SettingsItem label={t("surface_field_blur")}>
                        <NumberSlider value={frostedConfig.blur} min={0} max={30} step={0.1} onChange={(v) => updateFrosted({ blur: v })} />
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
                <div className="space-y-2.5">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/80">
                        {t("surface_material_customize_fluid")}
                    </div>

                    <SettingsItem label={t("surface_field_tint_opacity")}>
                        <NumberSlider value={fluidConfig.tintOpacity} min={0} max={0.75} step={0.01} onChange={(v) => updateFluid({ tintOpacity: v })} />
                    </SettingsItem>
                    <SettingsItem label={t("surface_field_saturation")}>
                        <NumberSlider value={fluidConfig.saturation} min={0} max={2} step={0.01} onChange={(v) => updateFluid({ saturation: v })} />
                    </SettingsItem>
                    <SettingsItem label={t("surface_field_blur")}>
                        <NumberSlider value={fluidConfig.blur} min={0} max={24} step={0.1} onChange={(v) => updateFluid({ blur: v })} />
                    </SettingsItem>
                    <SettingsItem label={t("surface_field_ior")}>
                        <NumberSlider value={fluidConfig.ior} min={1} max={2} step={0.01} onChange={(v) => updateFluid({ ior: v })} />
                    </SettingsItem>
                    <SettingsItem label={t("surface_field_thickness")}>
                        <NumberSlider value={fluidConfig.thickness} min={0.1} max={5} step={0.1} onChange={(v) => updateFluid({ thickness: v })} />
                    </SettingsItem>
                    <SettingsItem label={t("surface_field_anisotropy")}>
                        <NumberSlider value={fluidConfig.anisotropy} min={0} max={1} step={0.01} onChange={(v) => updateFluid({ anisotropy: v })} />
                    </SettingsItem>
                    <SettingsItem label={t("surface_field_chromatic_aberration")}>
                        <NumberSlider value={fluidConfig.chromaticAberration} min={0} max={1} step={0.01} onChange={(v) => updateFluid({ chromaticAberration: v })} />
                    </SettingsItem>
                    <SettingsItem label={t("surface_field_distortion")}>
                        <NumberSlider value={fluidConfig.distortion} min={0} max={1} step={0.01} onChange={(v) => updateFluid({ distortion: v })} />
                    </SettingsItem>
                    <SettingsItem label={t("surface_field_temporal_distortion")}>
                        <NumberSlider value={fluidConfig.temporalDistortion} min={0} max={1} step={0.01} onChange={(v) => updateFluid({ temporalDistortion: v })} />
                    </SettingsItem>
                </div>
            )}
        </SettingsSection>
    );
}

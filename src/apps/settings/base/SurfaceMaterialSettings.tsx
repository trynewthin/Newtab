import { useTranslation } from "react-i18next";
import { Sparkles } from "lucide-react";
import { useSettingsStore } from "@/apps/settings/store";
import { SettingsItem, SettingsSection } from "@/apps/settings/base/SettingComponents";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/platform/shared/ui/select";
import { Slider } from "@/platform/shared/ui/slider";
import { Switch } from "@/platform/shared/ui/switch";
import { Input } from "@/platform/shared/ui/input";
import {
    DEFAULT_APP_SURFACE_MATERIAL_CONFIG,
    RAYS_ORIGIN_OPTIONS,
    mergeSurfaceMaterialConfig,
    type AppSurfaceMaterial,
    type AppSurfaceTone,
    type DistortionGlassMaterialConfig,
    type RaysGlassMaterialConfig,
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
    const raysConfig = normalizedConfig["glass-rays"];

    const updateDistortion = (patch: Partial<DistortionGlassMaterialConfig>) => {
        updateSurfaceMaterialConfig("glass-distortion", patch);
    };

    const updateRays = (patch: Partial<RaysGlassMaterialConfig>) => {
        updateSurfaceMaterialConfig("glass-rays", patch);
    };

    const resetCurrentMaterial = () => {
        if (surfaceMaterial === "glass-distortion") {
            updateSurfaceMaterialConfig("glass-distortion", DEFAULT_APP_SURFACE_MATERIAL_CONFIG["glass-distortion"]);
            return;
        }
        updateSurfaceMaterialConfig("glass-rays", DEFAULT_APP_SURFACE_MATERIAL_CONFIG["glass-rays"]);
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
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="glass-distortion">{t("surface_material_glass_distortion")}</SelectItem>
                        <SelectItem value="glass-rays">{t("surface_material_glass_rays")}</SelectItem>
                    </SelectContent>
                </Select>
            </SettingsItem>

            <SettingsItem label={t("surface_material_tone")}>
                <Select value={surfaceTone} onValueChange={(value) => setSurfaceTone(value as AppSurfaceTone)}>
                    <SelectTrigger className="h-9 w-[220px] rounded-xl border-border/70 bg-background/85">
                        <SelectValue />
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
            ) : (
                <div className="space-y-2.5">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/80">
                        {t("surface_material_customize_rays")}
                    </div>

                    <SettingsItem label={t("surface_field_rays_origin")}>
                        <Select value={raysConfig.raysOrigin} onValueChange={(value) => updateRays({ raysOrigin: value as RaysGlassMaterialConfig["raysOrigin"] })}>
                            <SelectTrigger className="h-9 w-[220px] rounded-xl border-border/70 bg-background/85">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {RAYS_ORIGIN_OPTIONS.map((origin) => (
                                    <SelectItem key={origin} value={origin}>{origin}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </SettingsItem>
                    <SettingsItem label={t("surface_field_rays_color")}>
                        <Input
                            type="color"
                            value={raysConfig.raysColor}
                            onChange={(event) => updateRays({ raysColor: event.target.value })}
                            className="h-9 w-[220px] rounded-xl border-border/70 bg-background/85 p-1"
                        />
                    </SettingsItem>
                    <SettingsItem label={t("surface_field_rays_speed")}>
                        <NumberSlider value={raysConfig.raysSpeed} min={0} max={5} step={0.05} onChange={(v) => updateRays({ raysSpeed: v })} />
                    </SettingsItem>
                    <SettingsItem label={t("surface_field_light_spread")}>
                        <NumberSlider value={raysConfig.lightSpread} min={0} max={1.5} step={0.01} onChange={(v) => updateRays({ lightSpread: v })} />
                    </SettingsItem>
                    <SettingsItem label={t("surface_field_ray_length")}>
                        <NumberSlider value={raysConfig.rayLength} min={0.2} max={2} step={0.01} onChange={(v) => updateRays({ rayLength: v })} />
                    </SettingsItem>
                    <SettingsItem label={t("surface_field_fade_distance")}>
                        <NumberSlider value={raysConfig.fadeDistance} min={0.1} max={2} step={0.01} onChange={(v) => updateRays({ fadeDistance: v })} />
                    </SettingsItem>
                    <SettingsItem label={t("surface_field_saturation")}>
                        <NumberSlider value={raysConfig.saturation} min={0} max={1.5} step={0.01} onChange={(v) => updateRays({ saturation: v })} />
                    </SettingsItem>
                    <SettingsItem label={t("surface_field_mouse_influence")}>
                        <NumberSlider value={raysConfig.mouseInfluence} min={0} max={1} step={0.01} onChange={(v) => updateRays({ mouseInfluence: v })} />
                    </SettingsItem>
                    <SettingsItem label={t("surface_field_noise_amount")}>
                        <NumberSlider value={raysConfig.noiseAmount} min={0} max={1} step={0.01} onChange={(v) => updateRays({ noiseAmount: v })} />
                    </SettingsItem>
                    <SettingsItem label={t("surface_field_distortion")}>
                        <NumberSlider value={raysConfig.distortion} min={0} max={1} step={0.01} onChange={(v) => updateRays({ distortion: v })} />
                    </SettingsItem>
                    <SettingsItem label={t("surface_field_rays_class_name")}>
                        <Input
                            value={raysConfig.className}
                            onChange={(event) => updateRays({ className: event.target.value })}
                            placeholder={t("surface_field_rays_class_name_placeholder")}
                            className="h-9 w-[220px] rounded-xl border-border/70 bg-background/85"
                        />
                    </SettingsItem>
                    <SettingsItem label={t("surface_field_pulsating")}>
                        <Switch checked={raysConfig.pulsating} onCheckedChange={(checked) => updateRays({ pulsating: checked })} />
                    </SettingsItem>
                    <SettingsItem label={t("surface_field_follow_mouse")}>
                        <Switch checked={raysConfig.followMouse} onCheckedChange={(checked) => updateRays({ followMouse: checked })} />
                    </SettingsItem>
                </div>
            )}
        </SettingsSection>
    );
}

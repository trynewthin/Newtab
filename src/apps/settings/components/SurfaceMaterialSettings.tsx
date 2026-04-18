import { useTranslation } from "react-i18next";
import { useSettingsStore } from "@/apps/settings/store";
import {
    SETTINGS_ACTION_BUTTON_CLASS,
    SETTINGS_FIELD_CLASS,
    SettingsItem,
    SettingsSection,
} from "@/apps/settings/components/SettingComponents";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
    DEFAULT_APP_SURFACE_MATERIAL_CONFIG,
    mergeSurfaceMaterialConfig,
    type AppSurfaceMaterial,
    type AppSurfaceTone,
    type DistortionGlassMaterialConfig,
} from "@/core/surfaceMaterials";
import {
    DEFAULT_DYNAMIC_BACKGROUND_CONFIG,
    isDynamicBackgroundId,
} from "@/core/dynamicBackgrounds";
import AppSurface from "@/platform/ui/surface/AppSurface";
import ColorBends from "@/platform/ui/effects/ColorBends";
import LightPillar from "@/platform/ui/effects/LightPillar";
import Silk from "@/platform/ui/effects/Silk";
import FloatingLines from "@/platform/ui/effects/FloatingLines";
import Aurora from "@/platform/ui/effects/Aurora";
import Particles from "@/platform/ui/effects/Particles";

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
    const { backgroundConfig, dynamicBackgroundConfig } = useSettingsStore();

    const activeThemeId =
        backgroundConfig.type === "theme" && isDynamicBackgroundId(backgroundConfig.value)
            ? backgroundConfig.value
            : null;

    const renderBackground = () => {
        if (!activeThemeId) return null;
        const configs = dynamicBackgroundConfig;
        switch (activeThemeId) {
            case "color-bends": {
                const c = configs["color-bends"] ?? DEFAULT_DYNAMIC_BACKGROUND_CONFIG["color-bends"];
                return <ColorBends className="absolute inset-0 pointer-events-none" colors={c.colors} rotation={0} speed={c.speed} scale={c.scale} frequency={c.frequency} warpStrength={c.warpStrength} mouseInfluence={0} parallax={0} noise={c.noise} transparent autoRotate={0} color="" />;
            }
            case "light-pillar": {
                const c = configs["light-pillar"] ?? DEFAULT_DYNAMIC_BACKGROUND_CONFIG["light-pillar"];
                return <LightPillar className="absolute inset-0 pointer-events-none" topColor={c.topColor} bottomColor={c.bottomColor} intensity={c.intensity} rotationSpeed={c.rotationSpeed} interactive={false} glowAmount={c.glowAmount} pillarWidth={c.pillarWidth} pillarHeight={c.pillarHeight} noiseIntensity={c.noiseIntensity} mixBlendMode="screen" quality={c.quality} />;
            }
            case "silk": {
                const c = configs.silk ?? DEFAULT_DYNAMIC_BACKGROUND_CONFIG.silk;
                return <div className="absolute inset-0 pointer-events-none"><Silk speed={c.speed} scale={c.scale} color={c.color} noiseIntensity={c.noiseIntensity} rotation={c.rotation} /></div>;
            }
            case "floating-lines": {
                const c = configs["floating-lines"] ?? DEFAULT_DYNAMIC_BACKGROUND_CONFIG["floating-lines"];
                return <div className="absolute inset-0 pointer-events-none"><FloatingLines linesGradient={c.linesGradient} enabledWaves={["top", "middle", "bottom"]} lineCount={c.lineCount} lineDistance={c.lineDistance} animationSpeed={c.animationSpeed} interactive={false} parallax={c.parallax} mixBlendMode="screen" /></div>;
            }
            case "aurora": {
                const c = configs.aurora ?? DEFAULT_DYNAMIC_BACKGROUND_CONFIG.aurora;
                return <div className="absolute inset-0 pointer-events-none"><Aurora colorStops={c.colorStops} amplitude={c.amplitude} blend={c.blend} speed={c.speed} /></div>;
            }
            case "particles": {
                const c = configs.particles ?? DEFAULT_DYNAMIC_BACKGROUND_CONFIG.particles;
                return <div className="absolute inset-0 pointer-events-none"><Particles particleCount={c.particleCount} particleSpread={c.particleSpread} speed={c.speed} particleColors={c.particleColors} moveParticlesOnHover={false} alphaParticles particleBaseSize={c.particleBaseSize} sizeRandomness={c.sizeRandomness} cameraDistance={c.cameraDistance} disableRotation={false} pixelRatio={1} /></div>;
            }
            default:
                return null;
        }
    };

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
                    {renderBackground()}
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
    const updateDistortion = (patch: Partial<DistortionGlassMaterialConfig>) => {
        updateSurfaceMaterialConfig("glass-distortion", patch);
    };

    const updateFrosted = (patch: Partial<typeof frostedConfig>) => {
        updateSurfaceMaterialConfig("mac-frosted", patch);
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
    };

    const materialLabelMap: Record<AppSurfaceMaterial, string> = {
        "glass-distortion": t("surface_material_glass_distortion"),
        "mac-frosted": t("surface_material_mac_frosted"),
    };

    const toneLabelMap: Record<AppSurfaceTone, string> = {
        auto: t("surface_tone_auto"),
        light: t("surface_tone_light"),
        dark: t("surface_tone_dark"),
    };

    return (
        <SettingsSection title={t("surface_materials")}>
            <MaterialPreview />

            <SettingsItem label={t("surface_material_type")}>
                <Select value={surfaceMaterial} onValueChange={(value) => setSurfaceMaterial(value as AppSurfaceMaterial)}>
                    <SelectTrigger className={`${SETTINGS_FIELD_CLASS} w-[220px]`}>
                        <SelectValue>{materialLabelMap[surfaceMaterial]}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="glass-distortion">{t("surface_material_glass_distortion")}</SelectItem>
                        <SelectItem value="mac-frosted">{t("surface_material_mac_frosted")}</SelectItem>
                    </SelectContent>
                </Select>
            </SettingsItem>

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

            <SettingsItem label={t("surface_material_reset_label")}>
                <button
                    type="button"
                    onClick={resetCurrentMaterial}
                    className={SETTINGS_ACTION_BUTTON_CLASS}
                >
                    {t("surface_material_reset_button")}
                </button>
            </SettingsItem>

            {surfaceMaterial === "glass-distortion" ? (
                <div className="space-y-3.5">
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
                            <SelectTrigger className={`${SETTINGS_FIELD_CLASS} w-[220px]`}>
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
            ) : null}
        </SettingsSection>
    );
}

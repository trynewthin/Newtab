import { useTranslation } from "react-i18next";
import { RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SettingsItem } from "@/apps/settings/base/SettingComponents";
import { useSettingsStore } from "@/apps/settings/store";
import {
    DEFAULT_DYNAMIC_BACKGROUND_CONFIG,
    type DynamicBackgroundId,
    type DynamicBackgroundConfigMap,
} from "@/core/dynamicBackgrounds";

interface DynamicBackgroundConfigPanelProps {
    backgroundId: DynamicBackgroundId;
}

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
            <span className="w-12 text-right text-[11px] text-muted-foreground">{value.toFixed(step >= 1 ? 0 : 2)}</span>
        </div>
    );
}

function updateArrayValue<T extends string>(source: readonly T[], index: number, value: T): T[] {
    const next = [...source];
    next[index] = value;
    return next;
}

export function DynamicBackgroundConfigPanel({ backgroundId }: DynamicBackgroundConfigPanelProps) {
    const { t } = useTranslation();
    const { dynamicBackgroundConfig, updateDynamicBackgroundConfig, resetDynamicBackgroundConfig } = useSettingsStore();
    const colorBendsConfig = dynamicBackgroundConfig["color-bends"] ?? DEFAULT_DYNAMIC_BACKGROUND_CONFIG["color-bends"];
    const lightPillarConfig = dynamicBackgroundConfig["light-pillar"] ?? DEFAULT_DYNAMIC_BACKGROUND_CONFIG["light-pillar"];
    const silkConfig = dynamicBackgroundConfig.silk ?? DEFAULT_DYNAMIC_BACKGROUND_CONFIG.silk;
    const floatingLinesConfig = dynamicBackgroundConfig["floating-lines"] ?? DEFAULT_DYNAMIC_BACKGROUND_CONFIG["floating-lines"];
    const auroraConfig = dynamicBackgroundConfig.aurora ?? DEFAULT_DYNAMIC_BACKGROUND_CONFIG.aurora;
    const particlesConfig = dynamicBackgroundConfig.particles ?? DEFAULT_DYNAMIC_BACKGROUND_CONFIG.particles;
    const prismaticBurstConfig = dynamicBackgroundConfig["prismatic-burst"] ?? DEFAULT_DYNAMIC_BACKGROUND_CONFIG["prismatic-burst"];

    const updateConfig = <T extends DynamicBackgroundId>(
        target: T,
        patch: Partial<DynamicBackgroundConfigMap[T]>
    ) => {
        updateDynamicBackgroundConfig(target, patch);
    };
    const colorLabel = (index: number) => t("dynamic_bg_field_color_n", { index: index + 1 });

    return (
        <div className="space-y-2 rounded-2xl border border-border/65 bg-background/82 p-3.5">
            <div className="flex items-center justify-between">
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/85">
                    {t("dynamic_background_config")}
                </div>
                <button
                    type="button"
                    onClick={() => resetDynamicBackgroundConfig(backgroundId)}
                    className="inline-flex h-8 items-center gap-1 rounded-lg border border-border/70 px-2.5 text-[11px] font-semibold text-foreground/85 transition-colors hover:bg-foreground/8"
                >
                    <RotateCcw size={12} />
                    <span>{t("reset")}</span>
                </button>
            </div>

            {backgroundId === "color-bends" ? (
                <div className="space-y-2.5">
                    <SettingsItem label={t("dynamic_bg_field_speed")}>
                        <NumberSlider value={colorBendsConfig.speed} min={0.05} max={2} step={0.01} onChange={(v) => updateConfig("color-bends", { speed: v })} />
                    </SettingsItem>
                    <SettingsItem label={t("dynamic_bg_field_scale")}>
                        <NumberSlider value={colorBendsConfig.scale} min={0.5} max={2} step={0.01} onChange={(v) => updateConfig("color-bends", { scale: v })} />
                    </SettingsItem>
                    <SettingsItem label={t("dynamic_bg_field_frequency")}>
                        <NumberSlider value={colorBendsConfig.frequency} min={0.3} max={3} step={0.01} onChange={(v) => updateConfig("color-bends", { frequency: v })} />
                    </SettingsItem>
                    <SettingsItem label={t("dynamic_bg_field_warp_strength")}>
                        <NumberSlider value={colorBendsConfig.warpStrength} min={0} max={3} step={0.01} onChange={(v) => updateConfig("color-bends", { warpStrength: v })} />
                    </SettingsItem>
                    <SettingsItem label={t("dynamic_bg_field_noise")}>
                        <NumberSlider value={colorBendsConfig.noise} min={0} max={0.5} step={0.01} onChange={(v) => updateConfig("color-bends", { noise: v })} />
                    </SettingsItem>
                    {[0, 1, 2].map((index) => (
                        <SettingsItem key={`color-bends-color-${index}`} label={colorLabel(index)}>
                            <Input
                                type="color"
                                value={colorBendsConfig.colors[index]}
                                onChange={(event) =>
                                    updateConfig("color-bends", {
                                        colors: updateArrayValue(colorBendsConfig.colors, index, event.target.value) as [string, string, string],
                                    })
                                }
                                className="h-9 w-[220px] rounded-xl border-border/70 bg-background/85 p-1"
                            />
                        </SettingsItem>
                    ))}
                </div>
            ) : null}

            {backgroundId === "light-pillar" ? (
                <div className="space-y-2.5">
                    <SettingsItem label={t("dynamic_bg_field_top_color")}>
                        <Input
                            type="color"
                            value={lightPillarConfig.topColor}
                            onChange={(event) => updateConfig("light-pillar", { topColor: event.target.value })}
                            className="h-9 w-[220px] rounded-xl border-border/70 bg-background/85 p-1"
                        />
                    </SettingsItem>
                    <SettingsItem label={t("dynamic_bg_field_bottom_color")}>
                        <Input
                            type="color"
                            value={lightPillarConfig.bottomColor}
                            onChange={(event) => updateConfig("light-pillar", { bottomColor: event.target.value })}
                            className="h-9 w-[220px] rounded-xl border-border/70 bg-background/85 p-1"
                        />
                    </SettingsItem>
                    <SettingsItem label={t("dynamic_bg_field_intensity")}>
                        <NumberSlider value={lightPillarConfig.intensity} min={0.4} max={2} step={0.01} onChange={(v) => updateConfig("light-pillar", { intensity: v })} />
                    </SettingsItem>
                    <SettingsItem label={t("dynamic_bg_field_rotation_speed")}>
                        <NumberSlider value={lightPillarConfig.rotationSpeed} min={0} max={2} step={0.01} onChange={(v) => updateConfig("light-pillar", { rotationSpeed: v })} />
                    </SettingsItem>
                    <SettingsItem label={t("dynamic_bg_field_glow_amount")}>
                        <NumberSlider value={lightPillarConfig.glowAmount} min={0} max={0.02} step={0.0005} onChange={(v) => updateConfig("light-pillar", { glowAmount: v })} />
                    </SettingsItem>
                    <SettingsItem label={t("dynamic_bg_field_pillar_width")}>
                        <NumberSlider value={lightPillarConfig.pillarWidth} min={1} max={5} step={0.01} onChange={(v) => updateConfig("light-pillar", { pillarWidth: v })} />
                    </SettingsItem>
                    <SettingsItem label={t("dynamic_bg_field_pillar_height")}>
                        <NumberSlider value={lightPillarConfig.pillarHeight} min={0.1} max={1} step={0.01} onChange={(v) => updateConfig("light-pillar", { pillarHeight: v })} />
                    </SettingsItem>
                    <SettingsItem label={t("dynamic_bg_field_noise_intensity")}>
                        <NumberSlider value={lightPillarConfig.noiseIntensity} min={0} max={1} step={0.01} onChange={(v) => updateConfig("light-pillar", { noiseIntensity: v })} />
                    </SettingsItem>
                    <SettingsItem label={t("dynamic_bg_field_quality")}>
                        <Select
                            value={lightPillarConfig.quality}
                            onValueChange={(value) => updateConfig("light-pillar", { quality: value as "low" | "medium" | "high" })}
                        >
                            <SelectTrigger className="h-9 w-[220px] rounded-xl border-border/70 bg-background/85">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="low">{t("dynamic_bg_option_quality_low")}</SelectItem>
                                <SelectItem value="medium">{t("dynamic_bg_option_quality_medium")}</SelectItem>
                                <SelectItem value="high">{t("dynamic_bg_option_quality_high")}</SelectItem>
                            </SelectContent>
                        </Select>
                    </SettingsItem>
                </div>
            ) : null}

            {backgroundId === "silk" ? (
                <div className="space-y-2.5">
                    <SettingsItem label={t("dynamic_bg_field_color")}>
                        <Input
                            type="color"
                            value={silkConfig.color}
                            onChange={(event) => updateConfig("silk", { color: event.target.value })}
                            className="h-9 w-[220px] rounded-xl border-border/70 bg-background/85 p-1"
                        />
                    </SettingsItem>
                    <SettingsItem label={t("dynamic_bg_field_speed")}>
                        <NumberSlider value={silkConfig.speed} min={1} max={10} step={0.1} onChange={(v) => updateConfig("silk", { speed: v })} />
                    </SettingsItem>
                    <SettingsItem label={t("dynamic_bg_field_scale")}>
                        <NumberSlider value={silkConfig.scale} min={0.5} max={2} step={0.01} onChange={(v) => updateConfig("silk", { scale: v })} />
                    </SettingsItem>
                    <SettingsItem label={t("dynamic_bg_field_noise_intensity")}>
                        <NumberSlider value={silkConfig.noiseIntensity} min={0} max={3} step={0.01} onChange={(v) => updateConfig("silk", { noiseIntensity: v })} />
                    </SettingsItem>
                    <SettingsItem label={t("dynamic_bg_field_rotation")}>
                        <NumberSlider value={silkConfig.rotation} min={-3.14} max={3.14} step={0.01} onChange={(v) => updateConfig("silk", { rotation: v })} />
                    </SettingsItem>
                </div>
            ) : null}

            {backgroundId === "floating-lines" ? (
                <div className="space-y-2.5">
                    <SettingsItem label={t("dynamic_bg_field_animation_speed")}>
                        <NumberSlider value={floatingLinesConfig.animationSpeed} min={0.2} max={2} step={0.01} onChange={(v) => updateConfig("floating-lines", { animationSpeed: v })} />
                    </SettingsItem>
                    <SettingsItem label={t("dynamic_bg_field_parallax")}>
                        <Switch checked={floatingLinesConfig.parallax} onCheckedChange={(checked) => updateConfig("floating-lines", { parallax: checked })} />
                    </SettingsItem>
                    <SettingsItem label={t("dynamic_bg_field_top_lines")}>
                        <NumberSlider value={floatingLinesConfig.lineCount[0]} min={1} max={12} step={1} onChange={(v) => updateConfig("floating-lines", { lineCount: [Math.round(v), floatingLinesConfig.lineCount[1], floatingLinesConfig.lineCount[2]] })} />
                    </SettingsItem>
                    <SettingsItem label={t("dynamic_bg_field_middle_lines")}>
                        <NumberSlider value={floatingLinesConfig.lineCount[1]} min={1} max={12} step={1} onChange={(v) => updateConfig("floating-lines", { lineCount: [floatingLinesConfig.lineCount[0], Math.round(v), floatingLinesConfig.lineCount[2]] })} />
                    </SettingsItem>
                    <SettingsItem label={t("dynamic_bg_field_bottom_lines")}>
                        <NumberSlider value={floatingLinesConfig.lineCount[2]} min={1} max={12} step={1} onChange={(v) => updateConfig("floating-lines", { lineCount: [floatingLinesConfig.lineCount[0], floatingLinesConfig.lineCount[1], Math.round(v)] })} />
                    </SettingsItem>
                    <SettingsItem label={t("dynamic_bg_field_top_distance")}>
                        <NumberSlider value={floatingLinesConfig.lineDistance[0]} min={1} max={10} step={1} onChange={(v) => updateConfig("floating-lines", { lineDistance: [Math.round(v), floatingLinesConfig.lineDistance[1], floatingLinesConfig.lineDistance[2]] })} />
                    </SettingsItem>
                    <SettingsItem label={t("dynamic_bg_field_middle_distance")}>
                        <NumberSlider value={floatingLinesConfig.lineDistance[1]} min={1} max={10} step={1} onChange={(v) => updateConfig("floating-lines", { lineDistance: [floatingLinesConfig.lineDistance[0], Math.round(v), floatingLinesConfig.lineDistance[2]] })} />
                    </SettingsItem>
                    <SettingsItem label={t("dynamic_bg_field_bottom_distance")}>
                        <NumberSlider value={floatingLinesConfig.lineDistance[2]} min={1} max={10} step={1} onChange={(v) => updateConfig("floating-lines", { lineDistance: [floatingLinesConfig.lineDistance[0], floatingLinesConfig.lineDistance[1], Math.round(v)] })} />
                    </SettingsItem>
                    {[0, 1, 2].map((index) => (
                        <SettingsItem key={`floating-lines-color-${index}`} label={colorLabel(index)}>
                            <Input
                                type="color"
                                value={floatingLinesConfig.linesGradient[index]}
                                onChange={(event) =>
                                    updateConfig("floating-lines", {
                                        linesGradient: updateArrayValue(floatingLinesConfig.linesGradient, index, event.target.value) as [string, string, string],
                                    })
                                }
                                className="h-9 w-[220px] rounded-xl border-border/70 bg-background/85 p-1"
                            />
                        </SettingsItem>
                    ))}
                </div>
            ) : null}

            {backgroundId === "aurora" ? (
                <div className="space-y-2.5">
                    <SettingsItem label={t("dynamic_bg_field_amplitude")}>
                        <NumberSlider value={auroraConfig.amplitude} min={0.2} max={2} step={0.01} onChange={(v) => updateConfig("aurora", { amplitude: v })} />
                    </SettingsItem>
                    <SettingsItem label={t("dynamic_bg_field_blend")}>
                        <NumberSlider value={auroraConfig.blend} min={0.1} max={1} step={0.01} onChange={(v) => updateConfig("aurora", { blend: v })} />
                    </SettingsItem>
                    <SettingsItem label={t("dynamic_bg_field_speed")}>
                        <NumberSlider value={auroraConfig.speed} min={0.1} max={2} step={0.01} onChange={(v) => updateConfig("aurora", { speed: v })} />
                    </SettingsItem>
                    {[0, 1, 2].map((index) => (
                        <SettingsItem key={`aurora-color-${index}`} label={colorLabel(index)}>
                            <Input
                                type="color"
                                value={auroraConfig.colorStops[index]}
                                onChange={(event) =>
                                    updateConfig("aurora", {
                                        colorStops: updateArrayValue(auroraConfig.colorStops, index, event.target.value) as [string, string, string],
                                    })
                                }
                                className="h-9 w-[220px] rounded-xl border-border/70 bg-background/85 p-1"
                            />
                        </SettingsItem>
                    ))}
                </div>
            ) : null}

            {backgroundId === "particles" ? (
                <div className="space-y-2.5">
                    <SettingsItem label={t("dynamic_bg_field_particle_count")}>
                        <NumberSlider value={particlesConfig.particleCount} min={60} max={500} step={1} onChange={(v) => updateConfig("particles", { particleCount: Math.round(v) })} />
                    </SettingsItem>
                    <SettingsItem label={t("dynamic_bg_field_particle_spread")}>
                        <NumberSlider value={particlesConfig.particleSpread} min={4} max={20} step={1} onChange={(v) => updateConfig("particles", { particleSpread: Math.round(v) })} />
                    </SettingsItem>
                    <SettingsItem label={t("dynamic_bg_field_speed")}>
                        <NumberSlider value={particlesConfig.speed} min={0.02} max={0.5} step={0.01} onChange={(v) => updateConfig("particles", { speed: v })} />
                    </SettingsItem>
                    <SettingsItem label={t("dynamic_bg_field_particle_base_size")}>
                        <NumberSlider value={particlesConfig.particleBaseSize} min={30} max={180} step={1} onChange={(v) => updateConfig("particles", { particleBaseSize: Math.round(v) })} />
                    </SettingsItem>
                    <SettingsItem label={t("dynamic_bg_field_size_randomness")}>
                        <NumberSlider value={particlesConfig.sizeRandomness} min={0} max={1.5} step={0.01} onChange={(v) => updateConfig("particles", { sizeRandomness: v })} />
                    </SettingsItem>
                    <SettingsItem label={t("dynamic_bg_field_camera_distance")}>
                        <NumberSlider value={particlesConfig.cameraDistance} min={8} max={40} step={1} onChange={(v) => updateConfig("particles", { cameraDistance: Math.round(v) })} />
                    </SettingsItem>
                    {[0, 1, 2].map((index) => (
                        <SettingsItem key={`particles-color-${index}`} label={colorLabel(index)}>
                            <Input
                                type="color"
                                value={particlesConfig.particleColors[index]}
                                onChange={(event) =>
                                    updateConfig("particles", {
                                        particleColors: updateArrayValue(particlesConfig.particleColors, index, event.target.value) as [string, string, string],
                                    })
                                }
                                className="h-9 w-[220px] rounded-xl border-border/70 bg-background/85 p-1"
                            />
                        </SettingsItem>
                    ))}
                </div>
            ) : null}

            {backgroundId === "prismatic-burst" ? (
                <div className="space-y-2.5">
                    <SettingsItem label={t("dynamic_bg_field_intensity")}>
                        <NumberSlider value={prismaticBurstConfig.intensity} min={0.5} max={3} step={0.01} onChange={(v) => updateConfig("prismatic-burst", { intensity: v })} />
                    </SettingsItem>
                    <SettingsItem label={t("dynamic_bg_field_speed")}>
                        <NumberSlider value={prismaticBurstConfig.speed} min={0.1} max={1} step={0.01} onChange={(v) => updateConfig("prismatic-burst", { speed: v })} />
                    </SettingsItem>
                    <SettingsItem label={t("dynamic_bg_field_distort")}>
                        <NumberSlider value={prismaticBurstConfig.distort} min={0} max={20} step={0.1} onChange={(v) => updateConfig("prismatic-burst", { distort: v })} />
                    </SettingsItem>
                    <SettingsItem label={t("dynamic_bg_field_hover_dampness")}>
                        <NumberSlider value={prismaticBurstConfig.hoverDampness} min={0} max={1} step={0.01} onChange={(v) => updateConfig("prismatic-burst", { hoverDampness: v })} />
                    </SettingsItem>
                    <SettingsItem label={t("dynamic_bg_field_ray_count")}>
                        <NumberSlider value={prismaticBurstConfig.rayCount} min={4} max={32} step={1} onChange={(v) => updateConfig("prismatic-burst", { rayCount: Math.round(v) })} />
                    </SettingsItem>
                    <SettingsItem label={t("dynamic_bg_field_animation_type")}>
                        <Select
                            value={prismaticBurstConfig.animationType}
                            onValueChange={(value) => updateConfig("prismatic-burst", { animationType: value as "rotate" | "rotate3d" | "hover" })}
                        >
                            <SelectTrigger className="h-9 w-[220px] rounded-xl border-border/70 bg-background/85">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="rotate">{t("dynamic_bg_option_animation_rotate")}</SelectItem>
                                <SelectItem value="rotate3d">{t("dynamic_bg_option_animation_rotate3d")}</SelectItem>
                                <SelectItem value="hover">{t("dynamic_bg_option_animation_hover")}</SelectItem>
                            </SelectContent>
                        </Select>
                    </SettingsItem>
                    {[0, 1, 2, 3].map((index) => (
                        <SettingsItem key={`prismatic-color-${index}`} label={colorLabel(index)}>
                            <Input
                                type="color"
                                value={prismaticBurstConfig.colors[index]}
                                onChange={(event) =>
                                    updateConfig("prismatic-burst", {
                                        colors: updateArrayValue(prismaticBurstConfig.colors, index, event.target.value) as [string, string, string, string],
                                    })
                                }
                                className="h-9 w-[220px] rounded-xl border-border/70 bg-background/85 p-1"
                            />
                        </SettingsItem>
                    ))}
                </div>
            ) : null}
        </div>
    );
}

import { useSettingsStore } from "@/apps/settings/store";
import { cn } from "@/core/utils";
import { Check, Upload, Plus, Image as ImageIcon, Palette, Droplet, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react"
import { Cancel01Icon } from "@hugeicons/core-free-icons"
import { BACKGROUND_PRESETS } from "@/apps/settings/appearance/themeConfig";
import { useTranslation } from "react-i18next";
import { SettingsSection } from "./SettingComponents";
import { useRef } from "react";
import ColorBends from "@/components/ColorBends";
import LightPillar from "@/components/LightPillar";
import Silk from "@/components/Silk";
import FloatingLines from "@/components/FloatingLines";
import Aurora from "@/components/Aurora";
import Particles from "@/components/Particles";
import PrismaticBurst from "@/components/PrismaticBurst";
import {
    DEFAULT_DYNAMIC_BACKGROUND_CONFIG,
    isDynamicBackgroundId,
} from "@/core/dynamicBackgrounds";
import { DynamicBackgroundConfigPanel } from "./DynamicBackgroundConfigPanel";

export function BackgroundSelector() {
    const { t } = useTranslation();
    const {
        backgroundConfig,
        setBackgroundConfig,
        dynamicBackgroundConfig,
        solidColors,
        addSolidColor,
        removeSolidColor
    } = useSettingsStore();

    const gradientPresets = BACKGROUND_PRESETS.filter(p => p.type === 'gradient');
    const colorInputRef = useRef<HTMLInputElement>(null);
    const activeThemeId = backgroundConfig.type === 'theme' && isDynamicBackgroundId(backgroundConfig.value)
        ? backgroundConfig.value
        : null;

    const themeEffectPresets = [
        {
            id: "color-bends",
            nameKey: "theme_color_bends",
            descriptionKey: "theme_color_bends_desc",
        },
        {
            id: "light-pillar",
            nameKey: "theme_light_pillar",
            descriptionKey: "theme_light_pillar_desc",
        },
        {
            id: "silk",
            nameKey: "theme_silk",
            descriptionKey: "theme_silk_desc",
        },
        {
            id: "floating-lines",
            nameKey: "theme_floating_lines",
            descriptionKey: "theme_floating_lines_desc",
        },
        {
            id: "aurora",
            nameKey: "theme_aurora",
            descriptionKey: "theme_aurora_desc",
        },
        {
            id: "particles",
            nameKey: "theme_particles",
            descriptionKey: "theme_particles_desc",
        },
        {
            id: "prismatic-burst",
            nameKey: "theme_prismatic_burst",
            descriptionKey: "theme_prismatic_burst_desc",
        }
    ] as const;
    const activeThemeMeta = activeThemeId
        ? themeEffectPresets.find((item) => item.id === activeThemeId) ?? null
        : null;

    const renderDynamicThemePreview = (themeId: string) => {
        switch (themeId) {
            case "color-bends":
                {
                    const config = dynamicBackgroundConfig["color-bends"] ?? DEFAULT_DYNAMIC_BACKGROUND_CONFIG["color-bends"];
                return (
                    <ColorBends
                        className="absolute inset-0 pointer-events-none"
                        colors={config.colors}
                        rotation={0}
                        speed={config.speed}
                        scale={config.scale}
                        frequency={config.frequency}
                        warpStrength={config.warpStrength}
                        mouseInfluence={0}
                        parallax={0}
                        noise={config.noise}
                        transparent
                        autoRotate={0}
                        color=""
                    />
                );
                }

            case "light-pillar":
                {
                    const config = dynamicBackgroundConfig["light-pillar"] ?? DEFAULT_DYNAMIC_BACKGROUND_CONFIG["light-pillar"];
                return (
                    <LightPillar
                        className="absolute inset-0 pointer-events-none"
                        topColor={config.topColor}
                        bottomColor={config.bottomColor}
                        intensity={config.intensity}
                        rotationSpeed={config.rotationSpeed}
                        interactive={false}
                        glowAmount={config.glowAmount}
                        pillarWidth={config.pillarWidth}
                        pillarHeight={config.pillarHeight}
                        noiseIntensity={config.noiseIntensity}
                        mixBlendMode="screen"
                        quality={config.quality}
                    />
                );
                }

            case "silk":
                {
                    const config = dynamicBackgroundConfig.silk ?? DEFAULT_DYNAMIC_BACKGROUND_CONFIG.silk;
                return (
                    <div className="absolute inset-0 pointer-events-none">
                        <Silk speed={config.speed} scale={config.scale} color={config.color} noiseIntensity={config.noiseIntensity} rotation={config.rotation} />
                    </div>
                );
                }

            case "floating-lines":
                {
                    const config = dynamicBackgroundConfig["floating-lines"] ?? DEFAULT_DYNAMIC_BACKGROUND_CONFIG["floating-lines"];
                return (
                    <div className="absolute inset-0 pointer-events-none">
                        <FloatingLines
                            linesGradient={config.linesGradient}
                            enabledWaves={["top", "middle", "bottom"]}
                            lineCount={config.lineCount}
                            lineDistance={config.lineDistance}
                            animationSpeed={config.animationSpeed}
                            interactive={false}
                            parallax={config.parallax}
                            mixBlendMode="screen"
                        />
                    </div>
                );
                }

            case "aurora":
                {
                    const config = dynamicBackgroundConfig.aurora ?? DEFAULT_DYNAMIC_BACKGROUND_CONFIG.aurora;
                return (
                    <div className="absolute inset-0 pointer-events-none">
                        <Aurora
                            colorStops={config.colorStops}
                            amplitude={config.amplitude}
                            blend={config.blend}
                            speed={config.speed}
                        />
                    </div>
                );
                }

            case "particles":
                {
                    const config = dynamicBackgroundConfig.particles ?? DEFAULT_DYNAMIC_BACKGROUND_CONFIG.particles;
                return (
                    <div className="absolute inset-0 pointer-events-none">
                        <Particles
                            particleCount={config.particleCount}
                            particleSpread={config.particleSpread}
                            speed={config.speed}
                            particleColors={config.particleColors}
                            moveParticlesOnHover={false}
                            alphaParticles
                            particleBaseSize={config.particleBaseSize}
                            sizeRandomness={config.sizeRandomness}
                            cameraDistance={config.cameraDistance}
                            disableRotation={false}
                            pixelRatio={1}
                        />
                    </div>
                );
                }

            case "prismatic-burst":
                {
                    const config = dynamicBackgroundConfig["prismatic-burst"] ?? DEFAULT_DYNAMIC_BACKGROUND_CONFIG["prismatic-burst"];
                return (
                    <div className="absolute inset-0 pointer-events-none">
                        <PrismaticBurst
                            intensity={config.intensity}
                            speed={config.speed}
                            animationType={config.animationType}
                            colors={config.colors}
                            distort={config.distort}
                            hoverDampness={config.hoverDampness}
                            rayCount={config.rayCount}
                            mixBlendMode="screen"
                        />
                    </div>
                );
                }

            default:
                return null;
        }
    };

    const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const color = e.target.value;
        // Only update the background preview, don't add yet
        setBackgroundConfig({
            type: 'solid',
            value: color
        });
    };

    const handleColorComplete = (e: React.ChangeEvent<HTMLInputElement>) => {
        const color = e.target.value;
        // Add the color only when user finishes selecting
        if (!solidColors.includes(color)) {
            addSolidColor(color);
        }
        setBackgroundConfig({
            type: 'solid',
            value: color
        });
    };
    const getGradientLabel = (name: string) => t(`gradient_${name.toLowerCase()}`);

    return (
        <div className="space-y-8">
            <SettingsSection
                icon={Sparkles}
                iconColor="text-cyan-500"
                title={t("dynamic_backgrounds")}
                description={t("dynamic_backgrounds_desc")}
            >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {themeEffectPresets.map((theme) => (
                        <button
                            key={theme.id}
                            onClick={() => setBackgroundConfig({ type: 'theme', value: theme.id })}
                            className={cn(
                                "group relative w-full h-24 rounded-2xl overflow-hidden transition-all duration-500 border",
                                activeThemeId === theme.id
                                    ? "ring-2 ring-primary ring-offset-2 ring-offset-background/10 scale-[0.99] shadow-xl shadow-primary/20 border-primary/40"
                                    : "border-border/30 hover:border-primary/50 hover:scale-[1.01] active:scale-[0.99]"
                            )}
                        >
                            <div className="absolute inset-0 pointer-events-none">
                                <div className="absolute inset-0 bg-linear-to-b from-slate-800 to-black" />
                                {renderDynamicThemePreview(theme.id)}
                            </div>
                            <div className="absolute inset-0 bg-black/28" />
                            <div className="relative z-10 h-full flex items-center justify-between px-4">
                                <div className="text-left text-white">
                                    <div className="text-xs font-bold tracking-wider uppercase">{t(theme.nameKey)}</div>
                                    <div className="text-[11px] text-white/80">{t(theme.descriptionKey)}</div>
                                </div>
                                {activeThemeId === theme.id && (
                                    <div className="flex items-center justify-center w-5 h-5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white">
                                        <Check size={12} strokeWidth={3} />
                                    </div>
                                )}
                            </div>
                        </button>
                    ))}
                </div>
                {activeThemeId ? (
                    <div className="grid gap-3 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
                        <div className="lg:sticky lg:top-2 lg:self-start">
                            <div className="rounded-2xl border border-border/65 bg-background/82 p-2.5">
                                <div className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/85">
                                    {t("live_preview")}
                                </div>
                                <div className="relative h-52 overflow-hidden rounded-xl border border-border/60">
                                    <div className="absolute inset-0 pointer-events-none">
                                        <div className="absolute inset-0 bg-linear-to-b from-slate-800 to-black" />
                                        {renderDynamicThemePreview(activeThemeId)}
                                    </div>
                                    <div className="absolute inset-0 bg-black/25" />
                                    {activeThemeMeta ? (
                                        <div className="absolute bottom-0 left-0 right-0 z-10 bg-linear-to-t from-black/65 to-transparent px-3 py-2 text-white">
                                            <div className="text-[11px] font-bold uppercase tracking-[0.14em]">{t(activeThemeMeta.nameKey)}</div>
                                            <div className="text-[11px] text-white/80">{t(activeThemeMeta.descriptionKey)}</div>
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                        <DynamicBackgroundConfigPanel backgroundId={activeThemeId} />
                    </div>
                ) : null}
            </SettingsSection>

            {/* 1. Custom Image Upload */}
            <SettingsSection
                icon={ImageIcon}
                iconColor="text-blue-500"
                title={t('custom_image')}
                description={t('upload_image')}
            >
                <div className="space-y-4">
                    {/* Upload & URL Row */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <label className="flex-1 cursor-pointer group">
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        const reader = new FileReader();
                                        reader.onload = (event) => {
                                            const dataUrl = event.target?.result as string;
                                            setBackgroundConfig({
                                                type: 'image',
                                                value: dataUrl,
                                                blur: backgroundConfig.blur || 0,
                                                overlay: backgroundConfig.overlay || 0
                                            });
                                        };
                                        reader.readAsDataURL(file);
                                    }
                                }}
                            />
                            <div className="flex flex-col items-center justify-center gap-2 py-4 px-4 bg-secondary/20 hover:bg-secondary/40 rounded-2xl border-2 border-dashed border-border/30 hover:border-primary/50 transition-all group-active:scale-[0.98]">
                                <Upload size={18} className="text-primary/60 group-hover:text-primary transition-colors" />
                                <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground">{t('upload_image')}</span>
                            </div>
                        </label>

                        <div className="flex-2 flex flex-col justify-center gap-2">
                            <div className="flex gap-2 items-center bg-secondary/20 h-full p-2 rounded-2xl border border-border/30 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                                <Input
                                    type="url"
                                    placeholder={t('paste_url')}
                                    className="flex-1 border-none bg-transparent shadow-none focus-visible:ring-0 h-8 px-3 text-sm"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            const url = e.currentTarget.value.trim();
                                            if (url) {
                                                setBackgroundConfig({
                                                    type: 'image',
                                                    value: url,
                                                    blur: backgroundConfig.blur || 0,
                                                    overlay: backgroundConfig.overlay || 0
                                                });
                                                e.currentTarget.value = '';
                                            }
                                        }
                                    }}
                                />
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    className="rounded-xl px-3 h-7 text-xs font-medium shadow-sm active:scale-95 transition-transform"
                                    onClick={(e) => {
                                        const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                        const url = input?.value.trim();
                                        if (url) {
                                            setBackgroundConfig({
                                                type: 'image',
                                                value: url,
                                                blur: backgroundConfig.blur || 0,
                                                overlay: backgroundConfig.overlay || 0
                                            });
                                            input.value = '';
                                        }
                                    }}
                                >
                                    {t('apply')}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Effects Sliders */}
                    {backgroundConfig.type === 'image' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-in fade-in zoom-in-95 duration-300">
                            {[
                                { key: 'blur', label: t('blur_intensity'), max: 20, unit: 'px' },
                                { key: 'overlay', label: t('overlay_opacity'), max: 80, unit: '%' }
                            ].map((ef) => (
                                <div key={ef.key} className="space-y-2 bg-background/30 p-3 rounded-2xl border border-border/10">
                                    <div className="flex items-center justify-between px-1">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">
                                            {ef.label}
                                        </label>
                                        <span className="text-[10px] font-mono font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                            {(backgroundConfig as any)[ef.key] || 0}{ef.unit}
                                        </span>
                                    </div>
                                    <div className="flex gap-2 items-center">
                                        <input
                                            type="range"
                                            min="0"
                                            max={ef.max}
                                            value={(backgroundConfig as any)[ef.key] || 0}
                                            onChange={(e) => setBackgroundConfig({
                                                ...backgroundConfig,
                                                [ef.key]: parseInt(e.target.value)
                                            })}
                                            className="flex-1 h-1 bg-secondary/50 rounded-full appearance-none cursor-pointer accent-primary"
                                        />
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-6 w-6 rounded-full opacity-50 hover:opacity-100"
                                            onClick={() => setBackgroundConfig({ ...backgroundConfig, [ef.key]: 0 })}
                                        >
                                            <HugeiconsIcon icon={Cancel01Icon} className="w-3 h-3" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </SettingsSection>

            {/* 2. Solid Colors */}
            <SettingsSection
                icon={Droplet}
                iconColor="text-purple-500"
                title={t('solid_colors')}
                description={t('solid_colors_desc')}
            >
                <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
                    {solidColors.map((color) => (
                        <div
                            key={color}
                            className={cn(
                                "group relative aspect-square rounded-lg overflow-hidden cursor-pointer transition-all duration-300",
                                backgroundConfig.value === color && backgroundConfig.type === 'solid'
                                    ? "ring-2 ring-primary ring-offset-2 ring-offset-background/10 scale-95 shadow-lg shadow-primary/20"
                                    : "hover:scale-105 active:scale-95"
                            )}
                            onClick={() => setBackgroundConfig({ type: 'solid', value: color })}
                        >
                            <div className="absolute inset-0" style={{ backgroundColor: color }} />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />

                            {backgroundConfig.value === color && backgroundConfig.type === 'solid' && (
                                <div className="absolute inset-0 flex items-center justify-center text-white drop-shadow-md">
                                    <Check size={14} strokeWidth={3} />
                                </div>
                            )}

                            <button
                                onClick={(e) => { e.stopPropagation(); removeSolidColor(color); }}
                                className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/20 text-white opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-md hover:bg-destructive/80"
                            >
                                <Plus size={8} className="rotate-45" />
                            </button>
                        </div>
                    ))}

                    <label className="group relative aspect-square rounded-lg border-2 border-dashed border-border/30 hover:border-primary/50 transition-all cursor-pointer bg-secondary/10 flex flex-col items-center justify-center gap-0.5 hover:bg-secondary/20">
                        <input
                            ref={colorInputRef}
                            type="color"
                            className="opacity-0 absolute inset-0 cursor-pointer"
                            onChange={handleColorChange}
                            onBlur={handleColorComplete}
                        />
                        <Plus size={14} className="text-muted-foreground group-hover:text-primary transition-transform group-hover:scale-110" />
                        <span className="text-[8px] font-bold text-muted-foreground">{t('add')}</span>
                    </label>
                </div>
            </SettingsSection>

            {/* 3. Gradients */}
            <SettingsSection
                icon={Palette}
                iconColor="text-pink-500"
                title={t('gradients')}
                description={t('gradients_desc')}
            >
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {gradientPresets.map((preset) => (
                        <button
                            key={preset.name}
                            onClick={() => setBackgroundConfig({
                                type: preset.type as 'solid' | 'gradient',
                                value: preset.value
                            })}
                            className={cn(
                                "group relative h-14 rounded-xl overflow-hidden transition-all duration-500",
                                backgroundConfig.value === preset.value
                                    ? "ring-2 ring-primary ring-offset-2 ring-offset-background/10 scale-95 shadow-xl shadow-primary/20"
                                    : "hover:scale-[1.02] active:scale-95"
                            )}
                        >
                            <div className={cn("absolute inset-0 transition-transform duration-700 group-hover:scale-110", preset.preview)} />
                            <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

                            <span className="absolute bottom-1.5 left-2 text-[9px] font-bold text-white/90 uppercase tracking-wider drop-shadow-sm">
                                {getGradientLabel(preset.name)}
                            </span>

                            {backgroundConfig.value === preset.value && (
                                <div className="absolute top-1.5 right-1.5 flex items-center justify-center w-4 h-4 rounded-full bg-white/20 backdrop-blur-md border border-white/20 text-white">
                                    <Check size={10} strokeWidth={3} />
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </SettingsSection>
        </div>
    );
}


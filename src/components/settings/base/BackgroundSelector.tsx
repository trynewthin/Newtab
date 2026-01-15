import { useSettingsStore } from "@/store/modules/settings";
import { cn } from "@/lib/utils";
import { Check, Upload, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react"
import { Cancel01Icon } from "@hugeicons/core-free-icons"
import { BACKGROUND_PRESETS } from "../themeConfig";
import { useTranslation } from "react-i18next";
import { SettingsSection } from "./SettingsSection";

export function BackgroundSelector() {
    const { t } = useTranslation();
    const {
        backgroundConfig,
        setBackgroundConfig,
        solidColors,
        addSolidColor,
        removeSolidColor
    } = useSettingsStore();

    const gradientPresets = BACKGROUND_PRESETS.filter(p => p.type === 'gradient');

    const handleAddColor = (e: React.ChangeEvent<HTMLInputElement>) => {
        const color = e.target.value;
        if (!solidColors.includes(color)) {
            addSolidColor(color);
            setBackgroundConfig({
                type: 'solid',
                value: color
            });
        }
    };

    return (
        <div className="space-y-8">
            {/* 1. Image Upload & Controls */}
            <SettingsSection
                title={t('custom_image')}
                description={t('background_image_desc') || "Upload a local image or use a remote URL."}
            >
                <div className="space-y-6">
                    {/* Upload & URL Row */}
                    <div className="flex flex-col sm:flex-row gap-4">
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
                            <div className="flex flex-col items-center justify-center gap-2 py-6 px-4 bg-secondary/20 hover:bg-secondary/40 rounded-3xl border-2 border-dashed border-border/50 hover:border-primary/50 transition-all group-active:scale-[0.98]">
                                <Upload size={20} className="text-primary/60 group-hover:text-primary transition-colors" />
                                <span className="text-xs font-bold text-muted-foreground group-hover:text-foreground">{t('upload_image')}</span>
                            </div>
                        </label>

                        <div className="flex-2 flex flex-col justify-center gap-2">
                            <div className="flex gap-2 items-center bg-secondary/20 h-full p-2 rounded-3xl border border-border/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                                <Input
                                    type="url"
                                    placeholder={t('paste_url')}
                                    className="flex-1 border-none bg-transparent shadow-none focus-visible:ring-0 h-10 px-3 text-sm"
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
                                    className="rounded-2xl px-4 h-8 text-xs font-bold shadow-sm active:scale-95 transition-transform"
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in zoom-in-95 duration-300">
                            {[
                                { key: 'blur', label: t('blur_intensity'), max: 20, unit: 'px' },
                                { key: 'overlay', label: t('overlay_opacity'), max: 80, unit: '%' }
                            ].map((ef) => (
                                <div key={ef.key} className="space-y-3 bg-background/30 p-4 rounded-3xl border border-border/20">
                                    <div className="flex items-center justify-between px-1">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">
                                            {ef.label}
                                        </label>
                                        <span className="text-[10px] font-mono font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                            {(backgroundConfig as any)[ef.key] || 0}{ef.unit}
                                        </span>
                                    </div>
                                    <div className="flex gap-3 items-center">
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
                title={t('solid_colors')}
                description={t('solid_colors_desc') || "Simple solid backgrounds for focus."}
            >
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                    {solidColors.map((color) => (
                        <div
                            key={color}
                            className={cn(
                                "group relative aspect-square rounded-3xl overflow-hidden cursor-pointer transition-all duration-300",
                                backgroundConfig.value === color && backgroundConfig.type === 'solid'
                                    ? "ring-2 ring-primary ring-offset-4 ring-offset-background/10 scale-95 shadow-lg shadow-primary/20"
                                    : "hover:scale-105 active:scale-95"
                            )}
                            onClick={() => setBackgroundConfig({ type: 'solid', value: color })}
                        >
                            <div className="absolute inset-0" style={{ backgroundColor: color }} />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />

                            {backgroundConfig.value === color && backgroundConfig.type === 'solid' && (
                                <div className="absolute inset-0 flex items-center justify-center text-white drop-shadow-md">
                                    <Check size={20} strokeWidth={3} />
                                </div>
                            )}

                            <button
                                onClick={(e) => { e.stopPropagation(); removeSolidColor(color); }}
                                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/20 text-white opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-md hover:bg-destructive/80"
                            >
                                <Plus size={12} className="rotate-45" />
                            </button>
                        </div>
                    ))}

                    <label className="group relative aspect-square rounded-3xl border-2 border-dashed border-border/50 hover:border-primary/50 transition-all cursor-pointer bg-secondary/10 flex flex-col items-center justify-center gap-1 hover:bg-secondary/20">
                        <input type="color" className="opacity-0 absolute inset-0 cursor-pointer" onChange={handleAddColor} />
                        <Plus size={20} className="text-muted-foreground group-hover:text-primary transition-transform group-hover:scale-110" />
                        <span className="text-[10px] font-bold text-muted-foreground">{t('add')}</span>
                    </label>
                </div>
            </SettingsSection>

            {/* 3. Gradients */}
            <SettingsSection
                title={t('gradients')}
                description={t('gradients_desc') || "Beautiful curated mesh and linear gradients."}
            >
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {gradientPresets.map((preset) => (
                        <button
                            key={preset.name}
                            onClick={() => setBackgroundConfig({
                                type: preset.type as 'solid' | 'gradient',
                                value: preset.value
                            })}
                            className={cn(
                                "group relative h-20 rounded-3xl overflow-hidden transition-all duration-500",
                                backgroundConfig.value === preset.value
                                    ? "ring-2 ring-primary ring-offset-4 ring-offset-background/10 scale-95 shadow-xl shadow-primary/20"
                                    : "hover:scale-[1.02] active:scale-95"
                            )}
                        >
                            <div className={cn("absolute inset-0 transition-transform duration-700 group-hover:scale-110", preset.preview)} />
                            <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

                            <span className="absolute bottom-3 left-4 text-[11px] font-black text-white/90 uppercase tracking-widest drop-shadow-sm">
                                {preset.name}
                            </span>

                            {backgroundConfig.value === preset.value && (
                                <div className="absolute top-3 right-3 flex items-center justify-center w-6 h-6 rounded-full bg-white/20 backdrop-blur-md border border-white/20 text-white">
                                    <Check size={14} strokeWidth={3} />
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </SettingsSection>
        </div>
    );
}

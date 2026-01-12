import { useState } from "react";
import { useSettingsStore } from "@/store/modules/settings";
import { BaseModal, ModalButton } from "@/components/base";
import { cn } from "@/lib/utils";
import { Check, Upload, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react"
import { Cancel01Icon } from "@hugeicons/core-free-icons"
import { BACKGROUND_PRESETS, PRIMARY_COLORS } from "./themeConfig";
import { useTranslation } from "react-i18next";

interface ThemeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ThemeDialog({ open, onOpenChange }: ThemeDialogProps) {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<'background' | 'appearance'>('background');
    const {
        primaryColor,
        setPrimaryColor,
        backgroundConfig,
        setBackgroundConfig,
        solidColors,
        addSolidColor,
        removeSolidColor
    } = useSettingsStore();

    // 渐变预设
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
        <BaseModal
            open={open}
            onOpenChange={onOpenChange}
            className="sm:max-w-2xl"
            background={<div className="absolute inset-0 bg-background/95 backdrop-blur-xl" />}
            title={t('theme_settings')}
            header={
                <div className="flex items-center justify-between px-2 w-full">
                    <div className="flex items-center gap-2 bg-secondary/50 backdrop-blur-md p-1 rounded-xl border border-white/5 shadow-sm">
                        <button
                            onClick={() => setActiveTab('background')}
                            className={cn(
                                "px-4 py-1.5 text-sm font-medium rounded-lg transition-all",
                                activeTab === 'background'
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                            )}
                        >
                            {t('background')}
                        </button>
                        <button
                            onClick={() => setActiveTab('appearance')}
                            className={cn(
                                "px-4 py-1.5 text-sm font-medium rounded-lg transition-all",
                                activeTab === 'appearance'
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                            )}
                        >
                            {t('appearance')}
                        </button>
                    </div>

                    <ModalButton onClick={() => onOpenChange(false)}>
                        <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2.5} className="w-4 h-4" />
                        <span className="sr-only">{t('close')}</span>
                    </ModalButton>
                </div>
            }
        >
            <div className="py-2">
                {activeTab === 'background' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">

                        {/* 1. Custom Image */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-muted-foreground px-1">{t('custom_image')}</h3>

                            {/* Upload Button */}
                            <div className="flex gap-2">
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
                                    <div className="flex items-center justify-center gap-3 px-4 py-8 bg-secondary/30 hover:bg-secondary/50 rounded-2xl transition-all border border-dashed border-border/50 hover:border-primary/50 group-hover:scale-[1.01]">
                                        <div className="p-3 bg-background rounded-full shadow-sm">
                                            <Upload size={20} className="text-primary" />
                                        </div>
                                        <div className="text-center">
                                            <span className="text-sm font-medium block">{t('upload_image')}</span>
                                            <span className="text-xs text-muted-foreground">{t('support_formats')}</span>
                                        </div>
                                    </div>
                                </label>
                            </div>

                            {/* URL Input */}
                            <div className="flex gap-2 items-center bg-secondary/30 p-1.5 rounded-xl border border-white/5">
                                <Input
                                    type="url"
                                    placeholder={t('paste_url')}
                                    className="flex-1 border-none bg-transparent shadow-none focus-visible:ring-0 h-9"
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
                                            }
                                        }
                                    }}
                                />
                                <Button
                                    size="sm"
                                    className="rounded-lg px-4 h-8"
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

                            {/* Blur Control - Only show when image is active */}
                            {backgroundConfig.type === 'image' && (
                                <div className="space-y-6 pt-6 animate-in fade-in slide-in-from-bottom-2">
                                    {/* Blur */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between px-1">
                                            <label className="text-sm font-medium text-muted-foreground">
                                                {t('blur_intensity')}
                                            </label>
                                            <span className="text-xs font-mono bg-secondary/50 px-2 py-0.5 rounded text-foreground">
                                                {backgroundConfig.blur || 0}px
                                            </span>
                                        </div>
                                        <div className="flex gap-4 items-center">
                                            <input
                                                type="range"
                                                min="0"
                                                max="20"
                                                step="1"
                                                value={backgroundConfig.blur || 0}
                                                onChange={(e) => setBackgroundConfig({
                                                    ...backgroundConfig,
                                                    blur: parseInt(e.target.value)
                                                })}
                                                className="flex-1 h-1.5 bg-secondary rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-125"
                                            />
                                            <Button
                                                size="icon-sm"
                                                variant="ghost"
                                                className="h-8 w-8 rounded-full"
                                                onClick={() => setBackgroundConfig({
                                                    ...backgroundConfig,
                                                    blur: 0
                                                })}
                                                title={t('reset_blur')}
                                            >
                                                <HugeiconsIcon icon={Cancel01Icon} className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Overlay Opacity */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between px-1">
                                            <label className="text-sm font-medium text-muted-foreground">
                                                {t('overlay_opacity')}
                                            </label>
                                            <span className="text-xs font-mono bg-secondary/50 px-2 py-0.5 rounded text-foreground">
                                                {backgroundConfig.overlay || 0}%
                                            </span>
                                        </div>
                                        <div className="flex gap-4 items-center">
                                            <input
                                                type="range"
                                                min="0"
                                                max="80"
                                                step="5"
                                                value={backgroundConfig.overlay || 0}
                                                onChange={(e) => setBackgroundConfig({
                                                    ...backgroundConfig,
                                                    overlay: parseInt(e.target.value)
                                                })}
                                                className="flex-1 h-1.5 bg-secondary rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-125"
                                            />
                                            <Button
                                                size="icon-sm"
                                                variant="ghost"
                                                className="h-8 w-8 rounded-full"
                                                onClick={() => setBackgroundConfig({
                                                    ...backgroundConfig,
                                                    overlay: 0
                                                })}
                                                title={t('reset_overlay')}
                                            >
                                                <HugeiconsIcon icon={Cancel01Icon} className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="border-t border-border/50" />

                        {/* 2. Solid Colors */}
                        <div>
                            <div className="flex items-center justify-between mb-4 px-1">
                                <h3 className="text-sm font-medium text-muted-foreground">{t('solid_colors')}</h3>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {/* Saved Solid Colors */}
                                {solidColors.map((color) => (
                                    <div
                                        key={color}
                                        className={cn(
                                            "group relative h-16 rounded-2xl overflow-hidden border-2 transition-all cursor-pointer",
                                            backgroundConfig.value === color && backgroundConfig.type === 'solid'
                                                ? "border-primary shadow-lg shadow-primary/20 scale-[1.02]"
                                                : "border-transparent ring-1 ring-border/50 hover:scale-[1.02] hover:shadow-md"
                                        )}
                                        onClick={() => setBackgroundConfig({
                                            type: 'solid',
                                            value: color
                                        })}
                                    >
                                        <div
                                            className="absolute inset-0"
                                            style={{ backgroundColor: color }}
                                        />
                                        <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />

                                        {/* Color Value Label */}
                                        <span className="absolute bottom-2 left-3 text-[10px] font-mono font-medium text-white/80 drop-shadow-md tracking-wider uppercase">
                                            {color}
                                        </span>

                                        {/* Check Indicator */}
                                        {backgroundConfig.value === color && backgroundConfig.type === 'solid' && (
                                            <div className="absolute top-2 right-2 flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground shadow-sm animate-in zoom-in spin-in-90 duration-300">
                                                <Check size={12} strokeWidth={3} />
                                            </div>
                                        )}

                                        {/* Delete Button - Only show via hover */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeSolidColor(color);
                                            }}
                                            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/40 hover:bg-destructive text-white opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-sm"
                                            title="Remove color"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                ))}

                                {/* Add Custom Color Button */}
                                <label className="group relative h-16 rounded-2xl overflow-hidden border-2 border-dashed border-border/50 hover:border-primary/50 transition-all cursor-pointer bg-secondary/30 hover:bg-secondary/50 flex flex-col items-center justify-center gap-1">
                                    <input
                                        type="color"
                                        className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
                                        onChange={handleAddColor}
                                        value={backgroundConfig.type === "solid" ? backgroundConfig.value : "#000000"}
                                    />
                                    <div className="p-1.5 rounded-full bg-background shadow-sm group-hover:scale-110 transition-transform">
                                        <Plus size={16} className="text-muted-foreground" />
                                    </div>
                                    <span className="text-xs font-medium text-muted-foreground">{t('add_custom')}</span>
                                </label>
                            </div>
                        </div>

                        {/* 3. Gradients */}
                        <div>
                            <h3 className="text-sm font-medium text-muted-foreground mb-4 px-1">{t('gradients')}</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {gradientPresets.map((preset) => (
                                    <button
                                        key={preset.name}
                                        onClick={() => setBackgroundConfig({
                                            type: preset.type as 'solid' | 'gradient',
                                            value: preset.value
                                        })}
                                        className={cn(
                                            "group relative h-20 rounded-2xl overflow-hidden border-2 transition-all cursor-pointer",
                                            backgroundConfig.value === preset.value
                                                ? "border-primary shadow-lg shadow-primary/20 scale-[1.02]"
                                                : "border-transparent ring-1 ring-border/50 hover:scale-[1.02] hover:shadow-md"
                                        )}
                                    >
                                        <div className={cn("absolute inset-0", preset.preview)} />
                                        <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                                        <span className="absolute bottom-2 left-3 text-sm font-semibold text-white drop-shadow-md tracking-wide">
                                            {preset.name}
                                        </span>
                                        {backgroundConfig.value === preset.value && (
                                            <div className="absolute top-2 right-2 flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground shadow-sm animate-in zoom-in spin-in-90 duration-300">
                                                <Check size={12} strokeWidth={3} />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'appearance' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-300">
                        <div>
                            <label className="text-sm font-medium text-muted-foreground mb-4 block px-1">{t('primary_color_system')}</label>
                            <div className="grid grid-cols-6 gap-3 sm:gap-4 justify-items-center bg-secondary/20 p-6 rounded-3xl border border-white/5">
                                {PRIMARY_COLORS.map((color) => (
                                    <button
                                        key={color.name}
                                        onClick={() => setPrimaryColor(color.value)}
                                        className={cn(
                                            "w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transition-all shadow-sm",
                                            "hover:scale-110 focus:outline-none",
                                            primaryColor === color.value
                                                ? "scale-110 ring-4 ring-primary/20 shadow-lg shadow-primary/30"
                                                : "hover:shadow-md"
                                        )}
                                        style={{ backgroundColor: color.value }}
                                        title={color.name}
                                    >
                                        {primaryColor === color.value && (
                                            <Check className="text-white drop-shadow-sm" size={20} strokeWidth={3} />
                                        )}
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs text-muted-foreground mt-3 px-1 text-center">{t('select_accent_color')}</p>
                        </div>
                    </div>
                )}

            </div>
        </BaseModal >
    );
}

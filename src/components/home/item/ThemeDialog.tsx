import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { BaseModal, ModalButton } from "@/components/base/modal";
import { cn } from "@/lib/utils";
import { Check, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react"
import { Cancel01Icon } from "@hugeicons/core-free-icons"

interface ThemeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const PRIMARY_COLORS = [
    { name: 'Blue', value: 'hsl(217 91% 60%)' },
    { name: 'Purple', value: 'hsl(270 95% 65%)' },
    { name: 'Green', value: 'hsl(150 90% 45%)' },
    { name: 'Orange', value: 'hsl(30 95% 60%)' },
    { name: 'Red', value: 'hsl(350 90% 60%)' },
    { name: 'Pink', value: 'hsl(330 90% 65%)' },
];

const BACKGROUND_PRESETS = [
    { name: 'Default', type: 'solid', value: 'hsl(224 71% 4%)', preview: 'bg-[hsl(224,71%,4%)]' }, // Deep Blue/Black
    { name: 'Midnight', type: 'gradient', value: 'linear-gradient(to bottom right, #0f172a, #334155)', preview: 'bg-gradient-to-br from-slate-900 to-slate-700' },
    { name: 'Sunset', type: 'gradient', value: 'linear-gradient(to bottom right, #4c1d95, #be185d)', preview: 'bg-gradient-to-br from-violet-900 to-pink-700' },
    { name: 'Ocean', type: 'gradient', value: 'linear-gradient(to bottom right, #1e3a8a, #06b6d4)', preview: 'bg-gradient-to-br from-blue-900 to-cyan-500' },
    { name: 'Forest', type: 'gradient', value: 'linear-gradient(to bottom right, #022c22, #10b981)', preview: 'bg-gradient-to-br from-emerald-950 to-emerald-500' },
    { name: 'Aurora', type: 'gradient', value: 'linear-gradient(to bottom right, #000000, #1e1b4b, #4c1d95)', preview: 'bg-gradient-to-br from-black via-indigo-950 to-violet-800' },
    { name: 'Nebula', type: 'gradient', value: 'linear-gradient(to top right, #312e81, #be185d, #f59e0b)', preview: 'bg-gradient-to-tr from-indigo-900 via-pink-700 to-amber-500' },
    { name: 'Peach', type: 'gradient', value: 'linear-gradient(to bottom right, #ea580c, #f472b6)', preview: 'bg-gradient-to-br from-orange-600 to-pink-400' },
    { name: 'Royal', type: 'gradient', value: 'linear-gradient(to bottom right, #172554, #1e1b4b, #000000)', preview: 'bg-gradient-to-br from-blue-950 via-indigo-950 to-black' },
    { name: 'Lavender', type: 'gradient', value: 'linear-gradient(to bottom right, #5b21b6, #a78bfa)', preview: 'bg-gradient-to-br from-violet-800 to-violet-400' },
    { name: 'Cotton Candy', type: 'gradient', value: 'linear-gradient(to bottom right, #ec4899, #8b5cf6, #3b82f6)', preview: 'bg-gradient-to-br from-pink-500 via-violet-500 to-blue-500' },
    { name: 'Minimal', type: 'solid', value: 'hsl(0 0% 5%)', preview: 'bg-neutral-950' },
];

export function ThemeDialog({ open, onOpenChange }: ThemeDialogProps) {
    const [activeTab, setActiveTab] = useState<'background' | 'appearance'>('background');
    const { primaryColor, setPrimaryColor, backgroundConfig, setBackgroundConfig } = useAppStore();

    return (
        <BaseModal
            open={open}
            onOpenChange={onOpenChange}
            className="sm:max-w-2xl"
            background={<div className="absolute inset-0 bg-background/95 backdrop-blur-xl" />}
            title="Theme Settings"
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
                            Background
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
                            Appearance
                        </button>
                    </div>

                    <ModalButton onClick={() => onOpenChange(false)}>
                        <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2.5} className="w-4 h-4" />
                        <span className="sr-only">Close</span>
                    </ModalButton>
                </div>
            }
        >
            <div className="py-2">
                {activeTab === 'background' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {/* Presets */}
                        <div>
                            <h3 className="text-sm font-medium text-muted-foreground mb-4 px-1">Presets</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {BACKGROUND_PRESETS.map((preset) => (
                                    <button
                                        key={preset.name}
                                        onClick={() => setBackgroundConfig({
                                            type: preset.type as 'solid' | 'gradient',
                                            value: preset.value
                                        })}
                                        className={cn(
                                            "group relative h-28 rounded-2xl overflow-hidden border-2 transition-all cursor-pointer",
                                            backgroundConfig.value === preset.value
                                                ? "border-primary shadow-lg shadow-primary/20 scale-[1.02]"
                                                : "border-transparent ring-1 ring-border/50 hover:scale-[1.02] hover:shadow-md"
                                        )}
                                    >
                                        <div className={cn("absolute inset-0", preset.preview)} />
                                        <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                                        <span className="absolute bottom-3 left-3 text-sm font-semibold text-white drop-shadow-md tracking-wide">
                                            {preset.name}
                                        </span>
                                        {backgroundConfig.value === preset.value && (
                                            <div className="absolute top-2 right-2 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground shadow-sm animate-in zoom-in spin-in-90 duration-300">
                                                <Check size={14} strokeWidth={3} />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Custom Image */}
                        <div className="space-y-4 pt-2 border-t border-border/50">
                            <h3 className="text-sm font-medium text-muted-foreground mt-4 px-1">Custom Image</h3>

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
                                            <span className="text-sm font-medium block">Upload Image</span>
                                            <span className="text-xs text-muted-foreground">Support JPG, PNG, WebP</span>
                                        </div>
                                    </div>
                                </label>
                            </div>

                            {/* URL Input */}
                            <div className="flex gap-2 items-center bg-secondary/30 p-1.5 rounded-xl border border-white/5">
                                <Input
                                    type="url"
                                    placeholder="Or paste image URL..."
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
                                    Apply
                                </Button>
                            </div>

                            {/* Blur Control - Only show when image is active */}
                            {backgroundConfig.type === 'image' && (
                                <div className="space-y-6 pt-6 animate-in fade-in slide-in-from-bottom-2">
                                    {/* Blur */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between px-1">
                                            <label className="text-sm font-medium text-muted-foreground">
                                                Blur Intensity
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
                                                title="Reset Blur"
                                            >
                                                <HugeiconsIcon icon={Cancel01Icon} className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Overlay Opacity */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between px-1">
                                            <label className="text-sm font-medium text-muted-foreground">
                                                Overlay Opacity
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
                                                title="Reset Overlay"
                                            >
                                                <HugeiconsIcon icon={Cancel01Icon} className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'appearance' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-300">
                        <div>
                            <label className="text-sm font-medium text-muted-foreground mb-4 block px-1">Primary Color System</label>
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
                            <p className="text-xs text-muted-foreground mt-3 px-1 text-center">Select an accent color to apply throughout the interface.</p>
                        </div>
                    </div>
                )}

            </div>
        </BaseModal >
    );
}

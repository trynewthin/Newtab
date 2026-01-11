import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Modal } from "@/components/common/Modal";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

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
        <Modal
            open={open}
            onOpenChange={onOpenChange}
            className="sm:max-w-2xl bg-background/95 backdrop-blur-xl border-white/10"
            header={
                <div className="flex items-center gap-6 px-6 py-2 border-b border-border/50">
                    <button
                        onClick={() => setActiveTab('background')}
                        className={cn(
                            "text-base font-medium transition-colors relative py-2",
                            activeTab === 'background' ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Background
                        {activeTab === 'background' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('appearance')}
                        className={cn(
                            "text-base font-medium transition-colors relative py-2",
                            activeTab === 'appearance' ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Appearance
                        {activeTab === 'appearance' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                        )}
                    </button>
                </div>
            }
        >

            <div className="p-6">
                {activeTab === 'background' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {BACKGROUND_PRESETS.map((preset) => (
                                <button
                                    key={preset.name}
                                    onClick={() => setBackgroundConfig({
                                        type: preset.type as 'solid' | 'gradient',
                                        value: preset.value
                                    })}
                                    className={cn(
                                        "group relative h-28 rounded-xl overflow-hidden border-2 transition-all",
                                        backgroundConfig.value === preset.value
                                            ? "border-primary shadow-lg shadow-primary/20 scale-[1.02]"
                                            : "border-transparent hover:scale-[1.02] hover:shadow-md"
                                    )}
                                >
                                    <div className={cn("absolute inset-0", preset.preview)} />
                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                                    <span className="absolute bottom-2 left-3 text-sm font-medium text-white drop-shadow-md">
                                        {preset.name}
                                    </span>
                                    {backgroundConfig.value === preset.value && (
                                        <div className="absolute top-2 right-2 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground shadow-sm">
                                            <Check size={14} strokeWidth={3} />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'appearance' && (
                    <div className="space-y-6">
                        <div>
                            <label className="text-base font-medium text-muted-foreground mb-4 block">Primary Color</label>
                            <div className="flex flex-wrap gap-4">
                                {PRIMARY_COLORS.map((color) => (
                                    <button
                                        key={color.name}
                                        onClick={() => setPrimaryColor(color.value)}
                                        className={cn(
                                            "w-12 h-12 rounded-full flex items-center justify-center transition-transform",
                                            "hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 ring-primary",
                                            primaryColor === color.value && "scale-110 ring-2 ring-offset-2 ring-offset-background"
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
                        </div>
                    </div>
                )}

            </div>
        </Modal >
    );
}

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Image as ImageIcon, Palette } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SidebarHeader } from "@/components/base";
import { BackgroundSelector } from "./base/BackgroundSelector";
import { ThemeColorSelector } from "./base/ThemeColorSelector";

interface AppearanceSettingsProps {
    onOpenMobileMenu?: () => void;
    onClose?: () => void;
}

export function AppearanceSettings({ onOpenMobileMenu, onClose }: AppearanceSettingsProps) {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<'background' | 'appearance'>('background');

    return (
        <div className="h-full flex flex-col">
            <SidebarHeader
                title={t('appearance')}
                description={t('appearance_desc')}
                onMenuClick={onOpenMobileMenu}
                onClose={onClose}
            >
                <div className="flex items-center gap-1 bg-secondary/30 p-1.5 rounded-3xl border border-border/20 shadow-inner">
                    {[
                        { id: 'background', icon: ImageIcon, label: t('background') },
                        { id: 'appearance', icon: Palette, label: t('color_theme') }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            //@ts-ignore
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "px-4 py-1.5 text-xs font-bold uppercase tracking-widest rounded-2xl transition-all flex items-center gap-2 relative",
                                activeTab === tab.id
                                    ? "bg-background text-foreground shadow-md ring-1 ring-border/10"
                                    : "text-muted-foreground/60 hover:text-foreground hover:bg-background/40"
                            )}
                        >
                            <tab.icon size={13} strokeWidth={activeTab === tab.id ? 3 : 2} />
                            <span className="hidden sm:inline">{tab.label}</span>
                            {/* Removed the dot indicator below the active tab */}
                        </button>
                    ))}
                </div>
            </SidebarHeader>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="max-w-4xl mx-auto p-6 md:p-8 space-y-12">
                    {activeTab === 'background' ? (
                        <div className="animate-in fade-in slide-in-from-left-4 duration-500">
                            <BackgroundSelector />
                        </div>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                            <ThemeColorSelector />
                            <div className="mt-12 p-12 border-2 border-dashed border-border/20 rounded-3xl flex flex-col items-center justify-center text-center opacity-40">
                                <Palette size={48} className="text-muted-foreground mb-4" />
                                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                                    {t('coming_soon')}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

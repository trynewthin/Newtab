import { useState, useMemo } from "react";
import { AppModalV1 } from "@/components/modal/AppModalV1";
import { Settings, Palette, Bot, Info, Cpu, Sliders, type LucideIcon } from "lucide-react";
import { cn } from "@/core/utils";
import { useTranslation } from "react-i18next";
import { GeneralSettings } from "./general/GeneralSettings";
import { AppearanceSettings } from "./appearance/AppearanceSettings";
import { AiSettings } from "./ai/AiSettings";
import { AboutSettings } from "./about/AboutSettings";

interface SettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const SETTINGS_TABS: { id: string; icon: LucideIcon; labelKey: string }[] = [
    { id: 'general', icon: Settings, labelKey: 'general' },
    { id: 'appearance', icon: Palette, labelKey: 'theme_settings' },
    { id: 'ai', icon: Bot, labelKey: 'ai_assistant' },
    { id: 'about', icon: Info, labelKey: 'about' },
];

const AI_SUB_TABS: { id: string; icon: LucideIcon; labelKey: string }[] = [
    { id: 'config', icon: Cpu, labelKey: 'models' },
    { id: 'preferences', icon: Sliders, labelKey: 'preferences' },
];

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState("general");
    const [aiSubTab, setAiSubTab] = useState("config");

    const sidebarItems = useMemo(() =>
        SETTINGS_TABS.map(tab => ({ ...tab, label: t(tab.labelKey) })),
        [t]
    );

    const activeLabel = sidebarItems.find(i => i.id === activeTab)?.label || t('settings');

    const headerContent = (
        <div className="flex items-center justify-center flex-1 min-w-0">
            {activeTab === 'ai' ? (
                <div className="flex items-center gap-0.5 rounded-lg bg-foreground/6 p-0.5">
                    {AI_SUB_TABS.map(tab => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setAiSubTab(tab.id)}
                                className={cn(
                                    "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-medium transition-all",
                                    aiSubTab === tab.id
                                        ? "bg-foreground text-background shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <Icon size={11} />
                                <span>{t(tab.labelKey)}</span>
                            </button>
                        );
                    })}
                </div>
            ) : (
                <span className="text-[11px] font-semibold text-foreground/70 truncate">
                    {activeLabel}
                </span>
            )}
        </div>
    );

    const renderContent = () => {
        switch (activeTab) {
            case "general": return <GeneralSettings />;
            case "appearance": return <AppearanceSettings />;
            case "ai": return <AiSettings activeSubTab={aiSubTab} />;
            case "about": return <AboutSettings />;
            default: return <GeneralSettings />;
        }
    };

    return (
        <AppModalV1
            open={open}
            onOpenChange={onOpenChange}
            header={headerContent}
            sidebarItems={sidebarItems}
            sidebarActiveId={activeTab}
            onSidebarChange={setActiveTab}
        >
            {renderContent()}
        </AppModalV1>
    );
}

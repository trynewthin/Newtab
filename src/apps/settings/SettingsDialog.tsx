import { useState, useMemo } from "react";
import { AppModalV2Sidebar } from "@/platform/ui/modal";
import { Settings, Palette, Info, type LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { GeneralSettings } from "./general/GeneralSettings";
import { AppearanceSettings } from "./appearance/AppearanceSettings";
import { AboutSettings } from "./about/AboutSettings";

interface SettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const SETTINGS_TABS: { id: string; icon: LucideIcon; labelKey: string }[] = [
    { id: "general", icon: Settings, labelKey: "general" },
    { id: "appearance", icon: Palette, labelKey: "theme_settings" },
    { id: "about", icon: Info, labelKey: "about" },
];

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState("general");

    const sidebarItems = useMemo(
        () => SETTINGS_TABS.map((tab) => ({ ...tab, label: t(tab.labelKey) })),
        [t]
    );

    const activeLabel = sidebarItems.find((item) => item.id === activeTab)?.label || t("settings");

    const renderContent = () => {
        switch (activeTab) {
            case "general":
                return <GeneralSettings />;
            case "appearance":
                return <AppearanceSettings />;
            case "about":
                return <AboutSettings />;
            default:
                return <GeneralSettings />;
        }
    };

    return (
        <AppModalV2Sidebar
            open={open}
            onOpenChange={onOpenChange}
            sidebarStorageKey="settings"
            sidebarItems={sidebarItems}
            sidebarActiveId={activeTab}
            onSidebarChange={setActiveTab}
            contentClassName="min-h-0"
        >
            <div className="flex h-full min-h-0 flex-col">
                <div className="flex min-h-16 items-center justify-center bg-background/64 px-4 py-3 backdrop-blur-sm sm:px-6">
                    <span className="truncate text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground/70">
                        {activeLabel}
                    </span>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar px-4 py-4 sm:px-6 sm:py-5">
                    {renderContent()}
                </div>
            </div>
        </AppModalV2Sidebar>
    );
}

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
            headerTitle={activeLabel}
            bodyClassName="overflow-y-auto custom-scrollbar px-4 pb-4 sm:px-6 sm:pb-5"
        >
            {renderContent()}
        </AppModalV2Sidebar>
    );
}

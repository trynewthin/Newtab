import { useMemo, useState } from "react";
import { AppModalV2Sidebar } from "@/platform/ui/modal";
import { Settings, Palette, Info, type LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { GeneralSettings } from "./general/GeneralSettings";
import { AppearanceSettings, type ThemeSettingsSubPage } from "./appearance/AppearanceSettings";
import { AboutSettings } from "./about/AboutSettings";
import { ThemeQuickToggleButton } from "./components/ThemeQuickToggleButton";

interface SettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

type SettingsTabId = "general" | "appearance" | "about";

const SETTINGS_TABS: { id: SettingsTabId; icon: LucideIcon; labelKey: string }[] = [
    { id: "general", icon: Settings, labelKey: "general" },
    { id: "appearance", icon: Palette, labelKey: "theme_settings" },
    { id: "about", icon: Info, labelKey: "about" },
];

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<SettingsTabId>("general");
    const [appearanceSubPage, setAppearanceSubPage] = useState<ThemeSettingsSubPage>("home");

    const sidebarItems = useMemo(
        () => SETTINGS_TABS.map((tab) => ({ ...tab, label: t(tab.labelKey) })),
        [t]
    );

    const handleTabChange = (nextTab: string) => {
        const normalizedTab = nextTab as SettingsTabId;
        setActiveTab(normalizedTab);
        if (normalizedTab !== "appearance") {
            setAppearanceSubPage("home");
        }
    };

    const headerTitle = useMemo(() => {
        if (activeTab === "appearance") {
            if (appearanceSubPage === "background") return t("background");
            if (appearanceSubPage === "material") return t("surface_materials");
        }

        return sidebarItems.find((item) => item.id === activeTab)?.label || t("settings");
    }, [activeTab, appearanceSubPage, sidebarItems, t]);

    const renderContent = () => {
        switch (activeTab) {
            case "general":
                return <GeneralSettings />;
            case "appearance":
                return (
                    <AppearanceSettings
                        subPage={appearanceSubPage}
                        onSubPageChange={setAppearanceSubPage}
                    />
                );
            case "about":
                return <AboutSettings />;
            default:
                return <GeneralSettings />;
        }
    };

    return (
        <AppModalV2Sidebar
            open={open}
            onOpenChange={(nextOpen) => {
                if (!nextOpen) {
                    setAppearanceSubPage("home");
                }
                onOpenChange(nextOpen);
            }}
            sidebarStorageKey="settings"
            sidebarItems={sidebarItems}
            sidebarActiveId={activeTab}
            onSidebarChange={handleTabChange}
            sidebarToolbarAccessory={<ThemeQuickToggleButton />}
            contentClassName="min-h-0"
            headerTitle={headerTitle}
            onHeaderBack={activeTab === "appearance" && appearanceSubPage !== "home" ? () => setAppearanceSubPage("home") : undefined}
            headerBackLabel={t("back_to_theme_settings")}
            bodyClassName="overflow-y-auto custom-scrollbar px-4 pb-4 sm:px-6 sm:pb-5"
        >
            {renderContent()}
        </AppModalV2Sidebar>
    );
}

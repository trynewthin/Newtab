import { useEffect, useMemo, useState } from "react";
import { ThemePreferenceToggleButton } from "@/config";
import { AppModalV2Sidebar } from "@/platform/ui";
import { Settings, SlidersHorizontal, Palette, Info, type LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { GeneralSettings } from "./general/GeneralSettings";
import { ExperienceSettings } from "./experience/ExperienceSettings";
import { AppearanceSettings, type ThemeSettingsSubPage } from "./appearance/AppearanceSettings";
import { AboutSettings } from "./about/AboutSettings";

interface SettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

type SettingsTabId = "general" | "experience" | "appearance" | "about";
const SETTINGS_VIEW_STATE_STORAGE_KEY = "settings-dialog:view-state";
const DEFAULT_SETTINGS_TAB: SettingsTabId = "general";
const DEFAULT_APPEARANCE_SUB_PAGE: ThemeSettingsSubPage = "home";

const SETTINGS_TABS: { id: SettingsTabId; icon: LucideIcon; labelKey: string }[] = [
    { id: "general", icon: Settings, labelKey: "general" },
    { id: "experience", icon: SlidersHorizontal, labelKey: "experience_settings" },
    { id: "appearance", icon: Palette, labelKey: "theme_settings" },
    { id: "about", icon: Info, labelKey: "about" },
];

function readStoredSettingsViewState(): {
    activeTab: SettingsTabId;
    appearanceSubPage: ThemeSettingsSubPage;
} {
    if (typeof window === "undefined") {
        return {
            activeTab: DEFAULT_SETTINGS_TAB,
            appearanceSubPage: DEFAULT_APPEARANCE_SUB_PAGE,
        };
    }

    try {
        const rawValue = window.sessionStorage.getItem(SETTINGS_VIEW_STATE_STORAGE_KEY);
        if (!rawValue) {
            return {
                activeTab: DEFAULT_SETTINGS_TAB,
                appearanceSubPage: DEFAULT_APPEARANCE_SUB_PAGE,
            };
        }

        const parsed = JSON.parse(rawValue) as {
            activeTab?: string;
            appearanceSubPage?: string;
        };

        const activeTab = parsed.activeTab;
        const appearanceSubPage = parsed.appearanceSubPage;

        return {
            activeTab:
                activeTab === "general" || activeTab === "experience" || activeTab === "appearance" || activeTab === "about"
                    ? activeTab
                    : DEFAULT_SETTINGS_TAB,
            appearanceSubPage:
                appearanceSubPage === "background" || appearanceSubPage === "material" || appearanceSubPage === "home"
                    ? appearanceSubPage
                    : DEFAULT_APPEARANCE_SUB_PAGE,
        };
    } catch {
        return {
            activeTab: DEFAULT_SETTINGS_TAB,
            appearanceSubPage: DEFAULT_APPEARANCE_SUB_PAGE,
        };
    }
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<SettingsTabId>(() => readStoredSettingsViewState().activeTab);
    const [appearanceSubPage, setAppearanceSubPage] = useState<ThemeSettingsSubPage>(
        () => readStoredSettingsViewState().appearanceSubPage
    );

    useEffect(() => {
        if (!open || typeof window === "undefined") {
            return;
        }

        try {
            window.sessionStorage.setItem(
                SETTINGS_VIEW_STATE_STORAGE_KEY,
                JSON.stringify({
                    activeTab,
                    appearanceSubPage,
                })
            );
        } catch {
            // Ignore temporary storage write failures.
        }
    }, [activeTab, appearanceSubPage, open]);

    const handleOpenChange = (nextOpen: boolean) => {
        if (!nextOpen) {
            setActiveTab(DEFAULT_SETTINGS_TAB);
            setAppearanceSubPage(DEFAULT_APPEARANCE_SUB_PAGE);

            if (typeof window !== "undefined") {
                try {
                    window.sessionStorage.removeItem(SETTINGS_VIEW_STATE_STORAGE_KEY);
                } catch {
                    // Ignore temporary storage cleanup failures.
                }
            }
        }

        onOpenChange(nextOpen);
    };

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
            case "experience":
                return <ExperienceSettings />;
            case "about":
                return <AboutSettings />;
            default:
                return <GeneralSettings />;
        }
    };

    return (
        <AppModalV2Sidebar
            open={open}
            onOpenChange={handleOpenChange}
            sidebarStorageKey="settings"
            sidebarItems={sidebarItems}
            sidebarActiveId={activeTab}
            onSidebarChange={handleTabChange}
            sidebarToolbarContent={<ThemePreferenceToggleButton />}
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

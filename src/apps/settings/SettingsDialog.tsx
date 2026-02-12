import { useState } from "react";
import { AppModal, Sidebar, SidebarItem, usePersistedSidebarCollapsed } from "@/platform/shared/components";
import { Settings, Palette, Bot, Sparkles, Info } from "lucide-react";
import { useTranslation } from "react-i18next";
import { GeneralSettings } from "./general/GeneralSettings";
import { AppearanceSettings } from "./appearance/AppearanceSettings";
import { AiSettings } from "./ai/AiSettings";
import { FeatureSettings } from "./features/FeatureSettings";
import { AboutSettings } from "./about/AboutSettings";

interface SettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState("general");
    // Default to not collapsed for settings as it has many text labels
    const [isSidebarCollapsed, setIsSidebarCollapsed] = usePersistedSidebarCollapsed("settings-modal", false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);

    // On mobile, the sidebar should always be "expanded" within the drawer
    const effectiveCollapsed = isSidebarCollapsed && !showMobileMenu;

    const renderContent = () => {
        const props = {
            onOpenMobileMenu: () => setShowMobileMenu(true),
            onClose: () => onOpenChange(false)
        };

        switch (activeTab) {
            case "general": return <GeneralSettings {...props} />;
            case "appearance": return <AppearanceSettings {...props} />;
            case "ai": return <AiSettings {...props} />;
            case "features": return <FeatureSettings {...props} />;
            case "about": return <AboutSettings {...props} />;
            default: return <GeneralSettings {...props} />;
        }
    };

    return (
        <AppModal
            open={open}
            onOpenChange={onOpenChange}
            isCollapsed={isSidebarCollapsed}
            showMobileMenu={showMobileMenu}
            onCloseMobileMenu={() => setShowMobileMenu(false)}
            sidebar={
                <Sidebar
                    title={t('settings')}
                    isCollapsed={isSidebarCollapsed}
                    onCollapseChange={setIsSidebarCollapsed}
                    showMobileMenu={showMobileMenu}
                    onCloseMobileMenu={() => setShowMobileMenu(false)}
                >
                    <SidebarItem
                        icon={Settings}
                        label={t('general')}
                        isActive={activeTab === 'general'}
                        isCollapsed={effectiveCollapsed}
                        onClick={() => { setActiveTab('general'); setShowMobileMenu(false); }}
                    />
                    <SidebarItem
                        icon={Palette}
                        label={t('theme_settings')}
                        isActive={activeTab === 'appearance'}
                        isCollapsed={effectiveCollapsed}
                        onClick={() => { setActiveTab('appearance'); setShowMobileMenu(false); }}
                    />
                    <SidebarItem
                        icon={Bot}
                        label={t('ai_assistant')}
                        isActive={activeTab === 'ai'}
                        isCollapsed={effectiveCollapsed}
                        onClick={() => { setActiveTab('ai'); setShowMobileMenu(false); }}
                    />
                    <SidebarItem
                        icon={Sparkles}
                        label={t('features')}
                        isActive={activeTab === 'features'}
                        isCollapsed={effectiveCollapsed}
                        onClick={() => { setActiveTab('features'); setShowMobileMenu(false); }}
                    />
                    <div className="flex-1" /> {/* Spacer */}
                    <SidebarItem
                        icon={Info}
                        label={t('about')}
                        isActive={activeTab === 'about'}
                        isCollapsed={effectiveCollapsed}
                        onClick={() => { setActiveTab('about'); setShowMobileMenu(false); }}
                    />
                </Sidebar>
            }
        >
            {renderContent()}
        </AppModal>
    );
}


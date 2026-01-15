import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AppModal, Sidebar, SidebarItem, ThemeToggle } from "@/components/base";
import { Settings, Palette, Bot, Box } from "lucide-react";
import { GeneralSettings } from "./GeneralSettings";
import { AppearanceSettings } from "./AppearanceSettings";
import { AiSettings } from "./AiSettings";
import { FeatureSettings } from "./FeatureSettings";

interface SettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    defaultTab?: SettingsTab;
}

type SettingsTab = 'general' | 'appearance' | 'features' | 'ai';

export function SettingsDialog({ open, onOpenChange, defaultTab = 'general' }: SettingsDialogProps) {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<SettingsTab>(defaultTab);

    // Default to collapsed as requested
    const [isCollapsed, setIsCollapsed] = useState(true);
    const [showMobileMenu, setShowMobileMenu] = useState(false);

    const tabs = [
        { id: 'general', icon: Settings, label: t('general_settings') || "基础设置" },
        { id: 'appearance', icon: Palette, label: t('appearance') },
        { id: 'features', icon: Box, label: t('feature_management') || "功能管理" },
        { id: 'ai', icon: Bot, label: t('ai_assistant') },
    ];

    // On mobile, the sidebar should always be "expanded" within the drawer
    const effectiveCollapsed = isCollapsed && !showMobileMenu;

    const renderContent = () => {
        const props = {
            onOpenMobileMenu: () => setShowMobileMenu(true),
            onClose: () => onOpenChange(false)
        };

        switch (activeTab) {
            case 'general':
                return <GeneralSettings {...props} />;
            case 'appearance':
                return <AppearanceSettings {...props} />;
            case 'features':
                return <FeatureSettings {...props} />;
            case 'ai':
                return <AiSettings {...props} />;
            default:
                return null;
        }
    };

    return (
        <AppModal
            open={open}
            onOpenChange={onOpenChange}
            isCollapsed={isCollapsed}
            showMobileMenu={showMobileMenu}
            onCloseMobileMenu={() => setShowMobileMenu(false)}
            sidebar={
                <Sidebar
                    title={t('settings')}
                    isCollapsed={isCollapsed}
                    onCollapseChange={setIsCollapsed}
                    showMobileMenu={showMobileMenu}
                    onCloseMobileMenu={() => setShowMobileMenu(false)}
                    footer={<ThemeToggle isCollapsed={effectiveCollapsed} />}
                >
                    {tabs.map(tab => (
                        <SidebarItem
                            key={tab.id}
                            icon={tab.icon}
                            label={tab.label}
                            isActive={activeTab === tab.id}
                            isCollapsed={effectiveCollapsed}
                            onClick={() => {
                                setActiveTab(tab.id as SettingsTab);
                                setShowMobileMenu(false);
                            }}
                        />
                    ))}
                </Sidebar>
            }
        >
            {renderContent()}
        </AppModal>
    );
}

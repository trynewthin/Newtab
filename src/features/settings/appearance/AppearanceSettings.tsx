import { useTranslation } from "react-i18next";
import { SidebarHeader } from "@/components/shared";
import { BackgroundSelector } from "@/apps/setting/base/BackgroundSelector";

import { ThemeColorSelector } from "@/apps/setting/base/ThemeColorSelector";

interface AppearanceSettingsProps {
    onOpenMobileMenu?: () => void;
    onClose?: () => void;
}

export function AppearanceSettings({ onOpenMobileMenu, onClose }: AppearanceSettingsProps) {
    const { t } = useTranslation();

    return (
        <div className="h-full flex flex-col">
            <SidebarHeader
                title={t('appearance')}
                description={t('appearance_desc')}
                onMenuClick={onOpenMobileMenu}
                onClose={onClose}
            />

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="max-w-3xl mx-auto p-6 space-y-8">
                    {/* Theme Color Selector at Top */}
                    <ThemeColorSelector />

                    {/* Background Selector */}
                    <BackgroundSelector />
                </div>
            </div>
        </div>
    );
}

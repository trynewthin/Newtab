import { useTranslation } from "react-i18next";
import { SidebarHeader } from "@/components/shared";
import { SettingsSection } from "@/apps/setting/base/SettingComponents";
import { IconManagerTab } from "@/apps/setting/base/IconManagerTab";
import { Box } from "lucide-react";

interface FeatureSettingsProps {
    onOpenMobileMenu?: () => void;
    onClose?: () => void;
}

export function FeatureSettings({ onOpenMobileMenu, onClose }: FeatureSettingsProps) {
    const { t } = useTranslation();

    return (
        <div className="h-full flex flex-col">
            <SidebarHeader
                title={t('feature_management')}
                description={t('feature_desc')}
                onMenuClick={onOpenMobileMenu}
                onClose={onClose}
            />

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="max-w-3xl mx-auto p-6 space-y-8">
                    {/* System Components Section */}
                    <SettingsSection
                        icon={Box}
                        iconColor="text-purple-500"
                        title={t('sys_icons')}
                        description={t('sys_icons_desc')}
                    >
                        <IconManagerTab />
                    </SettingsSection>

                    {/* Coming Soon Placeholder */}
                    <div className="p-8 border-2 border-dashed border-border/10 rounded-2xl flex flex-col items-center justify-center text-center opacity-30">
                        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                            {t('coming_soon')}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

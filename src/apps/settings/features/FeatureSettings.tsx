import { useTranslation } from "react-i18next";
import { SidebarHeader } from "@/platform/shared/components";
import { SettingsSection } from "@/apps/settings/base/SettingComponents";
import { IconManagerTab } from "@/apps/settings/base/IconManagerTab";
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
                <div className="mx-auto max-w-3xl space-y-6 p-5">
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
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 bg-background/80 p-8 text-center">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground/80">
                            {t('coming_soon')}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}


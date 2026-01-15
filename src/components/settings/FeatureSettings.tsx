import { useTranslation } from "react-i18next";
import { SidebarHeader } from "@/components/base";
import { IconManagerTab } from "./base/IconManagerTab";

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
                <div className="max-w-4xl mx-auto p-6 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="px-1 space-y-2">
                        <h3 className="text-lg font-bold tracking-tight text-foreground/90">
                            {t('sys_icons')}
                        </h3>
                        <p className="text-xs text-muted-foreground/50 font-medium">
                            {t('sys_icons_desc')}
                        </p>
                    </div>

                    <div className="bg-background/10 backdrop-blur-xl border border-border/20 rounded-4xl p-6 md:p-8 shadow-inner">
                        <IconManagerTab />
                    </div>

                    <div className="p-12 border-2 border-dashed border-border/10 rounded-4xl flex flex-col items-center justify-center text-center opacity-30 mt-12">
                        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                            {t('coming_soon')}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

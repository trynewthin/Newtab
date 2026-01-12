import { BaseModal } from "@/components/base/modal";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Languages } from "lucide-react";


interface SettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
    const { t, i18n } = useTranslation();

    const toggleLang = () => {
        const nextLang = i18n.language === 'zh' ? 'en' : 'zh';
        i18n.changeLanguage(nextLang);
    };

    return (
        <BaseModal
            open={open}
            onOpenChange={onOpenChange}
            title={t('settings') || "Settings"}
            className="sm:max-w-md"
            background={<div className="absolute inset-0 bg-background/95 backdrop-blur-xl" />}
        >
            <div className="py-2 space-y-4">
                {/* 语言设置 */}
                <div className="p-4 border border-border/50 rounded-2xl bg-secondary/20 hover:bg-secondary/30 transition-colors">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                                <Languages size={20} />
                            </div>
                            <div>
                                <h3 className="font-medium text-foreground">
                                    {t('language') || "Language"}
                                </h3>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {i18n.language === 'zh' ? '当前语言：简体中文' : 'Current: English'}
                                </p>
                            </div>
                        </div>
                        <Button
                            onClick={toggleLang}
                            variant="secondary"
                            size="sm"
                            className="shrink-0 font-medium"
                        >
                            {t('switch_lang') || "Switch"}
                        </Button>
                    </div>
                </div>
            </div>
        </BaseModal>
    );
}

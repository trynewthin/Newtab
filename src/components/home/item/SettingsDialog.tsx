import { Modal } from "@/components/common/Modal";
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
        <Modal
            open={open}
            onOpenChange={onOpenChange}
            title="Settings"
            className="sm:max-w-md"
        >
            <div className="p-6 space-y-6">
                {/* 语言设置 */}
                <div className="p-4 border rounded-lg bg-background/50">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold flex items-center gap-2">
                                <Languages size={18} />
                                Language
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                Current: {i18n.language === 'zh' ? '中文' : 'English'}
                            </p>
                        </div>
                        <Button onClick={toggleLang} variant="outline">
                            {t('switch_lang')}
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
}

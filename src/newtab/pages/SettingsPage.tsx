import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Languages } from "lucide-react";

import { BasePage } from "@/components/common/BasePage";

export function SettingsPage() {
    const { t, i18n } = useTranslation();

    const toggleLang = () => {
        const nextLang = i18n.language === 'zh' ? 'en' : 'zh';
        i18n.changeLanguage(nextLang);
    };

    return (
        <BasePage className="p-8 flex items-center justify-center overflow-hidden">
            <div className="bg-card/80 backdrop-blur rounded-xl border max-w-2xl w-full p-8 shadow-xl">
                <h2 className="text-2xl font-bold mb-6">Settings</h2>


                <div className="space-y-6">
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

                <div className="mt-8">
                    <Link to="/" className="inline-flex items-center px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:opacity-80 transition-opacity">
                        ← Back to Home
                    </Link>
                </div>
            </div>
        </BasePage>
    );
}

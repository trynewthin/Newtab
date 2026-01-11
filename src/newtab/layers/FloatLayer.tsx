import { useTranslation } from "react-i18next";
import { useAppStore } from "@/lib/store";

export function FloatLayer() {
    const { t, i18n } = useTranslation();
    const { theme, setTheme } = useAppStore();

    const toggleLang = () => {
        const nextLang = i18n.language === 'zh' ? 'en' : 'zh';
        i18n.changeLanguage(nextLang);
    };

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    return (
        <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-4 right-4 flex gap-2 pointer-events-auto">
                <button
                    onClick={toggleTheme}
                    className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity shadow-sm border"
                >
                    Theme: {theme}
                </button>
                <button
                    onClick={toggleLang}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity shadow-sm"
                >
                    {t('switch_lang')}
                </button>
            </div>

            {/* 这里后续可以放置左下角设置齿轮、右下角信息等浮动元素 */}
        </div>
    );
}

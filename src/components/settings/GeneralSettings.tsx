import { useTranslation } from "react-i18next";
import { SidebarHeader } from "@/components/base";
import { SettingsSection } from "./base/SettingsSection";
import { Sun, Moon, Globe, Download, Upload, Monitor } from "lucide-react";
import { useSettingsStore } from "@/store/modules/settings";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

interface GeneralSettingsProps {
    onOpenMobileMenu?: () => void;
    onClose?: () => void;
}

export function GeneralSettings({ onOpenMobileMenu, onClose }: GeneralSettingsProps) {
    const { t, i18n } = useTranslation();
    const { theme, setTheme } = useSettingsStore();

    // Side effect to update DOM when theme changes in store
    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove("light", "dark");
        if (theme === "system") {
            const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
            root.classList.add(systemTheme);
        } else {
            root.classList.add(theme);
        }
    }, [theme]);

    const handleExportData = () => {
        try {
            const data = {
                settings: localStorage.getItem('app-settings'),
                tags: localStorage.getItem('app-tags'),
                todos: localStorage.getItem('app-todos'),
                pomodoro: localStorage.getItem('app-pomodoro'),
                ai: localStorage.getItem('ai-storage'),
                exportDate: new Date().toISOString(),
            };

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `newtab-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Export failed:', error);
        }
    };

    const handleImportData = () => {
        if (!confirm(t('restore_confirm') || "Importing data will overwrite all current settings. Continue?")) {
            return;
        }

        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target?.result as string);

                    if (data.settings) localStorage.setItem('app-settings', data.settings);
                    if (data.tags) localStorage.setItem('app-tags', data.tags);
                    if (data.todos) localStorage.setItem('app-todos', data.todos);
                    if (data.pomodoro) localStorage.setItem('app-pomodoro', data.pomodoro);
                    if (data.ai) localStorage.setItem('ai-storage', data.ai);

                    window.location.reload();
                } catch (error) {
                    console.error('Import failed:', error);
                    alert(t('restore_fail') || "Failed to import data. Please check the file format.");
                }
            };
            reader.readAsText(file);
        };
        input.click();
    };

    const changeLanguage = (lang: string) => {
        i18n.changeLanguage(lang);
        localStorage.setItem('i18nextLng', lang);
    };

    return (
        <div className="h-full flex flex-col">
            <SidebarHeader
                title={t('general_settings')}
                description={t('general_settings_desc')}
                onMenuClick={onOpenMobileMenu}
                onClose={onClose}
            />

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="max-w-4xl mx-auto p-6 md:p-8 space-y-8">
                    {/* Theme Mode */}
                    <SettingsSection
                        title={t('theme_mode')}
                        description={t('theme_mode_desc')}
                    >
                        <div className="flex gap-2">
                            {[
                                { id: 'light', icon: Sun, label: t('light') },
                                { id: 'dark', icon: Moon, label: t('dark') },
                                { id: 'system', icon: Monitor, label: t('system') }
                            ].map((item) => (
                                <button
                                    key={item.id}
                                    //@ts-ignore
                                    onClick={() => setTheme(item.id)}
                                    className={cn(
                                        "flex-1 flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border-2 transition-all",
                                        theme === item.id
                                            ? "border-primary bg-primary/5 text-primary shadow-sm ring-1 ring-primary/20"
                                            : "border-border/20 hover:border-primary/30 hover:bg-secondary/20 text-muted-foreground"
                                    )}
                                >
                                    <item.icon size={18} strokeWidth={theme === item.id ? 3 : 2} />
                                    <span className="font-bold text-[10px] uppercase tracking-wider">{item.label}</span>
                                </button>
                            ))}
                        </div>
                    </SettingsSection>

                    {/* Language */}
                    <SettingsSection
                        title={t('language')}
                        description={t('language_desc')}
                    >
                        <div className="flex gap-2">
                            {[
                                { id: 'zh', label: '简体中文' },
                                { id: 'en', label: 'English' }
                            ].map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => changeLanguage(item.id)}
                                    className={cn(
                                        "flex-1 flex items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all",
                                        i18n.language.startsWith(item.id)
                                            ? "border-primary bg-primary/5 text-primary shadow-sm ring-1 ring-primary/20"
                                            : "border-border/20 hover:border-primary/30 hover:bg-secondary/20 text-muted-foreground"
                                    )}
                                >
                                    <Globe size={18} strokeWidth={i18n.language.startsWith(item.id) ? 3 : 2} />
                                    <span className="font-bold text-sm tracking-tight">{item.label}</span>
                                </button>
                            ))}
                        </div>
                    </SettingsSection>

                    {/* Data Management */}
                    <SettingsSection
                        title={t('data_management')}
                        description={t('data_management_desc')}
                    >
                        <div className="flex gap-3">
                            <button
                                onClick={handleExportData}
                                className="flex-1 flex items-center justify-center gap-3 p-4 rounded-2xl border-2 border-border/20 hover:border-primary/30 hover:bg-primary/5 transition-all text-foreground/80"
                            >
                                <Download size={20} />
                                <span className="font-bold text-sm">{t('export')}</span>
                            </button>
                            <button
                                onClick={handleImportData}
                                className="flex-1 flex items-center justify-center gap-3 p-4 rounded-2xl border-2 border-border/20 hover:border-primary/30 hover:bg-primary/5 transition-all text-foreground/80"
                            >
                                <Upload size={20} />
                                <span className="font-bold text-sm">{t('import')}</span>
                            </button>
                        </div>
                    </SettingsSection>
                </div>
            </div>
        </div>
    );
}

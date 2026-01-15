import { useTranslation } from "react-i18next";
import { SidebarHeader } from "@/components/base";
import { SettingsSection, SettingsItem, SettingsActionButtons } from "./base/SettingComponents";
import { Settings as SettingsIcon, Globe, Database, Download, Upload } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSettingsStore } from "@/store/modules/settings";
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
        if (!confirm(t('restore_confirm'))) {
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
                    alert(t('restore_fail'));
                }
            };
            reader.readAsText(file);
        };
        input.click();
    };

    // Theme options with display names
    const themeOptions = {
        light: t('light'),
        dark: t('dark'),
        system: t('system')
    };

    // Language options with display names
    const languageOptions = {
        zh: '简体中文',
        en: 'English'
    };

    const currentLanguage = i18n.language.startsWith('zh') ? 'zh' : 'en';

    return (
        <div className="h-full flex flex-col">
            <SidebarHeader
                title={t('general_settings')}
                description={t('general_settings_desc')}
                onMenuClick={onOpenMobileMenu}
                onClose={onClose}
            />

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="max-w-3xl mx-auto p-6 space-y-8">
                    {/* System Preferences Section */}
                    <SettingsSection
                        icon={SettingsIcon}
                        iconColor="text-blue-500"
                        title={t('general_settings')}
                        description={t('theme_mode_desc')}
                    >
                        <SettingsItem label={t('theme_mode')}>
                            <Select value={theme} onValueChange={(value) => setTheme(value as any)}>
                                <SelectTrigger className="w-[180px] h-9 bg-background/40 border-border/30">
                                    <SelectValue>
                                        {themeOptions[theme as keyof typeof themeOptions]}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="light">{t('light')}</SelectItem>
                                    <SelectItem value="dark">{t('dark')}</SelectItem>
                                    <SelectItem value="system">{t('system')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </SettingsItem>
                    </SettingsSection>

                    {/* Language Section */}
                    <SettingsSection
                        icon={Globe}
                        iconColor="text-green-500"
                        title={t('language')}
                        description={t('language_desc')}
                    >
                        <SettingsItem label={t('language')}>
                            <Select
                                value={currentLanguage}
                                onValueChange={(lang) => {
                                    if (lang) {
                                        i18n.changeLanguage(lang);
                                        localStorage.setItem('i18nextLng', lang);
                                    }
                                }}
                            >
                                <SelectTrigger className="w-[180px] h-9 bg-background/40 border-border/30">
                                    <SelectValue>
                                        {languageOptions[currentLanguage as keyof typeof languageOptions]}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="zh">简体中文</SelectItem>
                                    <SelectItem value="en">English</SelectItem>
                                </SelectContent>
                            </Select>
                        </SettingsItem>
                    </SettingsSection>

                    {/* Data Management Section */}
                    <SettingsSection
                        icon={Database}
                        iconColor="text-orange-500"
                        title={t('data_management')}
                        description={t('data_management_desc')}
                    >
                        <SettingsItem label={t('data_management')}>
                            <SettingsActionButtons
                                actions={[
                                    { id: 'export', icon: Download, label: t('export'), onClick: handleExportData },
                                    { id: 'import', icon: Upload, label: t('import'), onClick: handleImportData }
                                ]}
                            />
                        </SettingsItem>
                    </SettingsSection>
                </div>
            </div>
        </div>
    );
}

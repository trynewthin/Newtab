import { useTranslation } from "react-i18next";
import { SidebarHeader } from "@/components/shared";
import { SettingsSection, SettingsItem, SettingsActionButtons } from "@/apps/setting/base/SettingComponents";
import { Settings as SettingsIcon, Globe, Database, Download, Upload, Search, Plus, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSettingsStore } from "@/store/modules/settings";
import { useEffect, useState } from "react";
import { SEARCH_ENGINES, APP_METADATA } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { persistenceManager } from "@/store/persistence/manager";

interface GeneralSettingsProps {
    onOpenMobileMenu?: () => void;
    onClose?: () => void;
}

export function GeneralSettings({ onOpenMobileMenu, onClose }: GeneralSettingsProps) {
    const { t, i18n } = useTranslation();
    const {
        theme,
        setTheme,
        searchEngine,
        setSearchEngine,
        customSearchEngines,
        addCustomSearchEngine,
        removeCustomSearchEngine
    } = useSettingsStore();

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

    const handleExportData = async () => {
        try {
            const blob = await persistenceManager.exportData(APP_METADATA.version);
            persistenceManager.downloadBackup(blob);
        } catch (error) {
            console.error('Export failed:', error);
            alert(t('export_fail') || 'Export failed');
        }
    };

    const handleImportData = () => {
        if (!confirm(t('restore_confirm'))) {
            return;
        }

        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.ntb';
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;

            try {
                await persistenceManager.importData(file);
                alert(t('restore_success'));
                window.location.reload();
            } catch (error) {
                console.error('Import failed:', error);
                alert(t('restore_fail'));
            }
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
        zh: '简体中�?,
        en: 'English'
    };

    const currentLanguage = i18n.language.startsWith('zh') ? 'zh' : 'en';

    // Merge system and custom engines
    const allEngines = [...SEARCH_ENGINES, ...customSearchEngines];
    const currentEngine = allEngines.find(e => e.value === searchEngine) || SEARCH_ENGINES[0];

    const [isAdding, setIsAdding] = useState(false);
    const [newEngine, setNewEngine] = useState({ name: '', url: '' });

    const handleAddEngine = () => {
        if (!newEngine.name || !newEngine.url) return;
        const value = `custom-${Date.now()}`;
        addCustomSearchEngine({
            ...newEngine,
            value,
            icon: `https://www.google.com/s2/favicons?domain=${new URL(newEngine.url).hostname}&sz=64`
        });
        setNewEngine({ name: '', url: '' });
        setIsAdding(false);
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
                <div className="max-w-3xl mx-auto p-6 space-y-8 pb-20">
                    {/* System Preference - Theme Section */}
                    <SettingsSection
                        icon={SettingsIcon}
                        iconColor="text-blue-500"
                        title={t('theme_mode')}
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

                    {/* Search Engine Section */}
                    <SettingsSection
                        icon={Search}
                        iconColor="text-purple-500"
                        title={t('search_engine')}
                        description={t('search_engine_desc')}
                    >
                        <div className="space-y-4">
                            <SettingsItem label={t('search_engine')}>
                                <Select value={searchEngine} onValueChange={(val) => val && setSearchEngine(val)}>
                                    <SelectTrigger className="w-[180px] h-9 bg-background/40 border-border/30">
                                        <SelectValue>
                                            <div className="flex items-center gap-2">
                                                <img src={currentEngine.icon} alt="" className="w-3.5 h-3.5" />
                                                <span className="truncate">{currentEngine.name}</span>
                                            </div>
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[300px] overflow-y-auto overflow-x-hidden custom-scrollbar">
                                        {allEngines.map((engine) => (
                                            <SelectItem key={engine.value} value={engine.value}>
                                                <div className="flex items-center gap-2">
                                                    <img src={engine.icon} alt="" className="w-3.5 h-3.5" />
                                                    <span className="truncate">{engine.name}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </SettingsItem>

                            {/* Custom Engines List */}
                            <div className="space-y-2 mt-4">
                                <h4 className="text-sm font-bold opacity-40 px-1">{t('custom_engines')}</h4>
                                <div className="grid gap-2">
                                    {customSearchEngines.map((engine) => (
                                        <div key={engine.value} className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border/10 group/engine">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <img src={engine.icon} alt="" className="w-4 h-4 rounded shadow-sm" />
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-sm font-bold truncate">{engine.name}</span>
                                                    <span className="text-[10px] opacity-40 truncate font-mono">{engine.url}</span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => removeCustomSearchEngine(engine.value)}
                                                className="p-2 opacity-0 group-hover/engine:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}

                                    {!isAdding ? (
                                        <button
                                            onClick={() => setIsAdding(true)}
                                            className="w-full h-12 flex items-center justify-center gap-2 rounded-xl border border-dashed border-border/30 hover:border-primary/50 hover:bg-primary/5 text-muted-foreground hover:text-primary transition-all text-sm font-bold"
                                        >
                                            <Plus size={16} />
                                            {t('add_custom_engine')}
                                        </button>
                                    ) : (
                                        <div className="p-4 rounded-2xl bg-muted/40 border border-border/20 space-y-3 animate-in fade-in slide-in-from-top-2">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest opacity-40">{t('engine_name')}</label>
                                                <Input
                                                    value={newEngine.name}
                                                    onChange={(e) => setNewEngine(prev => ({ ...prev, name: e.target.value }))}
                                                    placeholder="e.g. Google"
                                                    className="h-9 bg-background/50"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest opacity-40">{t('engine_url')}</label>
                                                <Input
                                                    value={newEngine.url}
                                                    onChange={(e) => setNewEngine(prev => ({ ...prev, url: e.target.value }))}
                                                    placeholder="https://google.com/search?q=%s"
                                                    className="h-9 bg-background/50 font-mono text-xs"
                                                />
                                            </div>
                                            <div className="flex justify-end gap-2 pt-2">
                                                <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)}>{t('cancel')}</Button>
                                                <Button size="sm" onClick={handleAddEngine} disabled={!newEngine.name || !newEngine.url}>{t('confirm')}</Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
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
                                    <SelectItem value="zh">简体中�?/SelectItem>
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

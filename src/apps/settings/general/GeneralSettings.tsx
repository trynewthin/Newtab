import { useTranslation } from "react-i18next";
import { SidebarHeader } from "@/platform/shared/components";
import { SettingsSection, SettingsItem, SettingsActionButtons } from "../base/SettingComponents";
import { Settings as SettingsIcon, Globe, Database, Download, Upload, Search, Plus, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/platform/shared/ui/select";
import { useSettingsStore } from "@/apps/settings/store";
import { useEffect, useState } from "react";
import { SEARCH_ENGINES, APP_METADATA } from "@/platform/core/constants";
import { Input } from "@/platform/shared/ui/input";
import { Button } from "@/platform/shared/ui/button";
import { persistenceManager } from "@/platform/state/persistence/manager";

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
            alert(t('export_fail'));
        }
    };

    const handleImportData = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.ntb';
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;

            try {
                const inspection = await persistenceManager.inspectBackup(file);
                if (!inspection.supported) {
                    alert(t("restore_version_unsupported", {
                        source: inspection.sourceSchemaVersion,
                        target: inspection.targetSchemaVersion,
                    }));
                    return;
                }

                const confirmText = t("restore_confirm_with_version", {
                    appVersion: inspection.appVersion || t("unknown"),
                    sourceSchema: inspection.sourceSchemaVersion,
                    targetSchema: inspection.targetSchemaVersion,
                    strategy: inspection.requiresMigration
                        ? t("restore_strategy_migrate")
                        : t("restore_strategy_direct"),
                });

                if (!confirm(confirmText)) {
                    return;
                }

                await persistenceManager.importData(file);
                alert(t('restore_success_with_version', {
                    appVersion: inspection.appVersion || t("unknown"),
                    schema: inspection.targetSchemaVersion,
                }));
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
        zh: t('language_name_zh'),
        en: t('language_name_en')
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
                <div className="mx-auto max-w-3xl space-y-6 p-5 pb-16">
                    {/* System Preference - Theme Section */}
                    <SettingsSection
                        icon={SettingsIcon}
                        iconColor="text-blue-500"
                        title={t('theme_mode')}
                        description={t('theme_mode_desc')}
                    >
                        <SettingsItem label={t('theme_mode')}>
                            <Select value={theme} onValueChange={(value) => setTheme(value as any)}>
                                <SelectTrigger className="h-9 w-[180px] rounded-xl border-border/70 bg-background/85">
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
                                    <SelectTrigger className="h-9 w-[180px] rounded-xl border-border/70 bg-background/85">
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
                                <h4 className="px-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">{t('custom_engines')}</h4>
                                <div className="grid gap-2">
                                    {customSearchEngines.map((engine) => (
                                        <div key={engine.value} className="group/engine flex items-center justify-between rounded-xl border border-border/60 bg-background/80 p-3">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <img src={engine.icon} alt="" className="w-4 h-4 rounded shadow-sm" />
                                                <div className="flex flex-col min-w-0">
                                                    <span className="truncate text-sm font-semibold">{engine.name}</span>
                                                    <span className="truncate font-mono text-[10px] text-muted-foreground/70">{engine.url}</span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => removeCustomSearchEngine(engine.value)}
                                                className="p-2 opacity-0 text-muted-foreground transition-all group-hover/engine:opacity-100 hover:bg-foreground/8 hover:text-foreground rounded-lg"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}

                                    {!isAdding ? (
                                        <button
                                            onClick={() => setIsAdding(true)}
                                            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border/70 text-sm font-semibold text-muted-foreground transition-all hover:bg-foreground/6 hover:text-foreground"
                                        >
                                            <Plus size={16} />
                                            {t('add_custom_engine')}
                                        </button>
                                    ) : (
                                        <div className="space-y-3 rounded-2xl border border-border/70 bg-background/88 p-4 animate-in fade-in slide-in-from-top-2">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/80">{t('engine_name')}</label>
                                                <Input
                                                    value={newEngine.name}
                                                    onChange={(e) => setNewEngine(prev => ({ ...prev, name: e.target.value }))}
                                                    placeholder={t('engine_name_placeholder')}
                                                    className="h-9 border-border/70 bg-background/90"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/80">{t('engine_url')}</label>
                                                <Input
                                                    value={newEngine.url}
                                                    onChange={(e) => setNewEngine(prev => ({ ...prev, url: e.target.value }))}
                                                    placeholder={t('engine_url_placeholder')}
                                                    className="h-9 border-border/70 bg-background/90 font-mono text-xs"
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
                                <SelectTrigger className="h-9 w-[180px] rounded-xl border-border/70 bg-background/85">
                                    <SelectValue>
                                        {languageOptions[currentLanguage as keyof typeof languageOptions]}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="zh">{languageOptions.zh}</SelectItem>
                                    <SelectItem value="en">{languageOptions.en}</SelectItem>
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


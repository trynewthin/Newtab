import { BaseModal } from "@/components/base";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Languages, Download, Upload, Database } from "lucide-react";
import { useTagStore } from "@/store/modules/tag";
import { useTodoStore } from "@/store/modules/todo";
import { usePomodoroStore } from "@/store/modules/pomodoro";
import { useSettingsStore } from "@/store/modules/settings";
import { useRef } from "react";

interface SettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
    const { t, i18n } = useTranslation();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const tagStore = useTagStore();
    const todoStore = useTodoStore();
    const pomodoroStore = usePomodoroStore();
    const settingsStore = useSettingsStore();

    const toggleLang = () => {
        const nextLang = i18n.language === 'zh' ? 'en' : 'zh';
        i18n.changeLanguage(nextLang);
    };

    const handleExport = () => {
        const exportData = {
            version: 1,
            timestamp: Date.now(),
            data: {
                tags: tagStore.tags,
                todos: todoStore.todos,
                pomodoro: {
                    config: pomodoroStore.config,
                },
                settings: {
                    theme: settingsStore.theme,
                    primaryColor: settingsStore.primaryColor,
                    solidColors: settingsStore.solidColors,
                    searchEngine: settingsStore.searchEngine,
                },
            },
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `newtab-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);
                if (json.version !== 1 || !json.data) {
                    alert(t('invalid_format'));
                    return;
                }

                const { data } = json;

                if (data.tags) tagStore.setTags(data.tags);
                if (data.todos) todoStore.setTodos(data.todos);
                if (data.pomodoro?.config) pomodoroStore.setConfig(data.pomodoro.config);
                if (data.settings) {
                    settingsStore.setTheme(data.settings.theme);
                    settingsStore.setPrimaryColor(data.settings.primaryColor);
                    settingsStore.setSearchEngine(data.settings.searchEngine);
                    if (data.settings.solidColors) {
                        useSettingsStore.setState({ solidColors: data.settings.solidColors });
                    }
                }

                alert(t('restore_success'));
                onOpenChange(false);
            } catch (err) {
                console.error("Import failed:", err);
                alert(t('restore_fail'));
            }
        };
        reader.readAsText(file);
    };

    return (
        <BaseModal
            open={open}
            onOpenChange={onOpenChange}
            title={t('settings')}
            className="sm:max-w-md"
            background={<div className="absolute inset-0 bg-background" />}
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
                                    {t('language')}
                                </h3>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {t('current_lang')}
                                </p>
                            </div>
                        </div>
                        <Button
                            onClick={toggleLang}
                            variant="secondary"
                            size="sm"
                            className="shrink-0 font-medium"
                        >
                            {t('switch_lang')}
                        </Button>
                    </div>
                </div>

                {/* 导入/导出设置 */}
                <div className="p-4 border border-border/50 rounded-2xl bg-secondary/20 hover:bg-secondary/30 transition-colors">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500 shrink-0">
                                <Database size={20} />
                            </div>
                            <div className="min-w-0">
                                <h3 className="font-medium text-foreground">
                                    {t('data_management')}
                                </h3>
                                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                    {t('backup_restore_desc')}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                            <Button
                                onClick={handleExport}
                                variant="secondary"
                                size="sm"
                                className="h-8 w-8 p-0 rounded-lg"
                                title={t('export')}
                            >
                                <Download size={14} />
                            </Button>

                            <Button
                                onClick={() => fileInputRef.current?.click()}
                                variant="secondary"
                                size="sm"
                                className="h-8 w-8 p-0 rounded-lg"
                                title={t('import')}
                            >
                                <Upload size={14} />
                            </Button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept=".json"
                                onChange={handleImport}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </BaseModal>
    );
}

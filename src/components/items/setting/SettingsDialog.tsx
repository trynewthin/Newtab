import { BaseModal } from "@/components/base";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Languages, Download, Upload, Database, AlertCircle } from "lucide-react";
import { useTagStore } from "@/store/modules/tag";
import { useTodoStore } from "@/store/modules/todo";
import { usePomodoroStore } from "@/store/modules/pomodoro";
import { useSettingsStore } from "@/store/modules/settings";
import { useAiStore } from "@/webagent";
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
    const aiStore = useAiStore();

    const toggleLang = () => {
        const nextLang = i18n.language === 'zh' ? 'en' : 'zh';
        i18n.changeLanguage(nextLang);
    };

    const handleExport = () => {
        const exportData = {
            version: 2,
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
                    backgroundConfig: settingsStore.backgroundConfig,
                },
                ai: {
                    models: aiStore.models,
                    activeModelId: aiStore.activeModelId,
                    activeVisionModelId: aiStore.activeVisionModelId,
                    sessions: aiStore.sessions,
                    currentSessionId: aiStore.currentSessionId,
                }
            },
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `newtab-full-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // 🔥 增加二次确认
        if (!confirm("确定要恢复备份吗？这将会覆盖你当前的所有配置和标签。")) {
            e.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);

                if (!json.data || (json.version !== 1 && json.version !== 2)) {
                    alert("无效的备份文件格式。");
                    return;
                }

                const { data } = json;

                // 1. 恢复标签 (Tags/Folders)
                if (data.tags) tagStore.setTags(data.tags);

                // 2. 恢复待办 (Todos)
                if (data.todos) todoStore.setTodos(data.todos);

                // 3. 恢复番茄钟 (Pomodoro)
                if (data.pomodoro?.config) pomodoroStore.setConfig(data.pomodoro.config);

                // 4. 恢复系统设置 (Settings)
                if (data.settings) {
                    if (data.settings.theme) settingsStore.setTheme(data.settings.theme);
                    if (data.settings.primaryColor) settingsStore.setPrimaryColor(data.settings.primaryColor);
                    if (data.settings.searchEngine) settingsStore.setSearchEngine(data.settings.searchEngine);
                    if (data.settings.solidColors) {
                        useSettingsStore.setState({ solidColors: data.settings.solidColors });
                    }
                    if (data.settings.backgroundConfig) {
                        settingsStore.setBackgroundConfig(data.settings.backgroundConfig);
                    }
                }

                // 5. 恢复 AI 配置 (AI Store - v2+)
                if (data.ai) {
                    useAiStore.setState({
                        models: data.ai.models || [],
                        activeModelId: data.ai.activeModelId || null,
                        activeVisionModelId: data.ai.activeVisionModelId || null,
                        sessions: data.ai.sessions || [],
                        currentSessionId: data.ai.currentSessionId || null,
                    });
                }

                alert("数据恢复成功！部分更改（如 AI 会话列表）可能需要刷新页面后完全同步。");
                onOpenChange(false);

                // 可选：静默刷新或提示刷新
                // window.location.reload(); 
            } catch (err) {
                console.error("Import failed:", err);
                alert("恢复失败：文件内容损坏或不兼容。");
            }
        };
        reader.readAsText(file);
        e.target.value = ''; // 重置 input 以便下次选择同一文件
    };

    return (
        <BaseModal
            open={open}
            onOpenChange={onOpenChange}
            title={t('settings')}
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
                                className="h-10 px-4 rounded-xl flex items-center gap-2"
                                title={t('export')}
                            >
                                <Download size={16} />
                                <span className="text-xs font-bold uppercase tracking-wider">{t('export')}</span>
                            </Button>

                            <Button
                                onClick={() => fileInputRef.current?.click()}
                                variant="secondary"
                                size="sm"
                                className="h-10 px-4 rounded-xl flex items-center gap-2"
                                title={t('import')}
                            >
                                <Upload size={16} />
                                <span className="text-xs font-bold uppercase tracking-wider">{t('import')}</span>
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

                {/* 友情提示 */}
                <div className="flex items-start gap-2 px-2 py-1 opacity-50">
                    <AlertCircle size={14} className="mt-0.5 text-muted-foreground" />
                    <p className="text-[10px] text-muted-foreground leading-tight">
                        备份不包含具体的 AI 对话历史内容（仅保留配置和列表）和本地上传的壁纸原图，请知悉。
                    </p>
                </div>
            </div>
        </BaseModal>
    );
}

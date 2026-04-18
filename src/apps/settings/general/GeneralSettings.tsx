import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Globe, Database, Download, Upload, Search, Plus, Trash2, RotateCcw } from "lucide-react";
import { useLanguagePreferenceStore, useSearchPreferenceStore } from "@/config";
import { SEARCH_ENGINES, APP_METADATA } from "@/shared/constants";
import { persistenceManager } from "@/platform/persistence/manager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SettingsActionButtons, SettingsItem, SettingsSection } from "../components/SettingComponents";

export function GeneralSettings() {
    const { t } = useTranslation();
    const currentLanguage = useLanguagePreferenceStore((state) => state.language);
    const setLanguage = useLanguagePreferenceStore((state) => state.setLanguage);
    const searchEngine = useSearchPreferenceStore((state) => state.searchEngine);
    const setSearchEngine = useSearchPreferenceStore((state) => state.setSearchEngine);
    const customSearchEngines = useSearchPreferenceStore((state) => state.customSearchEngines);
    const addCustomSearchEngine = useSearchPreferenceStore((state) => state.addCustomSearchEngine);
    const removeCustomSearchEngine = useSearchPreferenceStore((state) => state.removeCustomSearchEngine);

    const [isAdding, setIsAdding] = useState(false);
    const [newEngine, setNewEngine] = useState({ name: "", url: "" });

    const languageOptions = {
        zh: t("language_name_zh"),
        en: t("language_name_en"),
    };
    const allEngines = [...SEARCH_ENGINES, ...customSearchEngines];
    const currentEngine = allEngines.find((engine) => engine.value === searchEngine) || SEARCH_ENGINES[0];

    const handleExportData = async () => {
        try {
            const blob = await persistenceManager.exportData(APP_METADATA.version);
            persistenceManager.downloadBackup(blob);
        } catch (error) {
            console.error("Export failed:", error);
            alert(t("export_fail"));
        }
    };

    const handleImportData = () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".ntb";
        input.onchange = async (event) => {
            const file = (event.target as HTMLInputElement).files?.[0];
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
                alert(t("restore_success_with_version", {
                    appVersion: inspection.appVersion || t("unknown"),
                    schema: inspection.targetSchemaVersion,
                }));
                window.location.reload();
            } catch (error) {
                console.error("Import failed:", error);
                alert(t("restore_fail"));
            }
        };
        input.click();
    };

    const handleAddEngine = () => {
        if (!newEngine.name || !newEngine.url) return;

        const value = `custom-${Date.now()}`;
        addCustomSearchEngine({
            ...newEngine,
            value,
            icon: `https://www.google.com/s2/favicons?domain=${new URL(newEngine.url).hostname}&sz=64`,
        });
        setNewEngine({ name: "", url: "" });
        setIsAdding(false);
    };

    return (
        <div className="mx-auto max-w-3xl space-y-6">
            <SettingsSection
                icon={Search}
                iconColor="text-purple-500"
                title={t("search_engine")}
                description={t("search_engine_desc")}
            >
                <div className="space-y-4">
                    <SettingsItem label={t("search_engine")}>
                        <Select value={searchEngine} onValueChange={(value) => value && setSearchEngine(value)}>
                            <SelectTrigger className="h-9 w-[180px] rounded-xl border-foreground/10 bg-foreground/4">
                                <SelectValue>
                                    <div className="flex items-center gap-2">
                                        <img src={currentEngine.icon} alt="" className="h-3.5 w-3.5" />
                                        <span className="truncate">{currentEngine.name}</span>
                                    </div>
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px] overflow-x-hidden overflow-y-auto custom-scrollbar">
                                {allEngines.map((engine) => (
                                    <SelectItem key={engine.value} value={engine.value}>
                                        <div className="flex items-center gap-2">
                                            <img src={engine.icon} alt="" className="h-3.5 w-3.5" />
                                            <span className="truncate">{engine.name}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </SettingsItem>

                    <div className="mt-4 space-y-2">
                        <h4 className="px-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">
                            {t("custom_engines")}
                        </h4>
                        <div className="grid gap-2">
                            {customSearchEngines.map((engine) => (
                                <div
                                    key={engine.value}
                                    className="group/engine flex items-center justify-between rounded-xl p-3 shadow-[0_2px_6px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_6px_rgba(255,255,255,0.05)]"
                                >
                                    <div className="flex min-w-0 items-center gap-3">
                                        <img src={engine.icon} alt="" className="h-4 w-4 rounded shadow-sm" />
                                        <div className="flex min-w-0 flex-col">
                                            <span className="truncate text-sm font-semibold">{engine.name}</span>
                                            <span className="truncate font-mono text-[10px] text-muted-foreground/70">
                                                {engine.url}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => removeCustomSearchEngine(engine.value)}
                                        className="rounded-lg p-2 text-muted-foreground opacity-0 transition-all group-hover/engine:opacity-100 hover:bg-foreground/8 hover:text-foreground"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}

                            {!isAdding ? (
                                <button
                                    onClick={() => setIsAdding(true)}
                                    className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-foreground/10 bg-foreground/4 text-sm font-semibold text-muted-foreground transition-all hover:border-foreground/20 hover:bg-foreground/6 hover:text-foreground"
                                >
                                    <Plus size={16} />
                                    {t("add_custom_engine")}
                                </button>
                            ) : (
                                <div className="animate-in slide-in-from-top-2 fade-in space-y-3 rounded-2xl p-4 shadow-[0_4px_12px_rgba(0,0,0,0.12),0_2px_6px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_12px_rgba(255,255,255,0.08),0_2px_6px_rgba(255,255,255,0.05)]">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/80">
                                            {t("engine_name")}
                                        </label>
                                        <Input
                                            value={newEngine.name}
                                            onChange={(event) => setNewEngine((prev) => ({ ...prev, name: event.target.value }))}
                                            placeholder={t("engine_name_placeholder")}
                                            className="h-9 border-foreground/10 bg-foreground/4"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/80">
                                            {t("engine_url")}
                                        </label>
                                        <Input
                                            value={newEngine.url}
                                            onChange={(event) => setNewEngine((prev) => ({ ...prev, url: event.target.value }))}
                                            placeholder={t("engine_url_placeholder")}
                                            className="h-9 border-foreground/10 bg-foreground/4 font-mono text-xs"
                                        />
                                    </div>
                                    <div className="flex justify-end gap-2 pt-2">
                                        <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)}>
                                            {t("cancel")}
                                        </Button>
                                        <Button size="sm" onClick={handleAddEngine} disabled={!newEngine.name || !newEngine.url}>
                                            {t("confirm")}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </SettingsSection>

            <SettingsSection
                icon={Globe}
                iconColor="text-green-500"
                title={t("language")}
                description={t("language_desc")}
            >
                <SettingsItem label={t("language")}>
                    <Select
                        value={currentLanguage}
                        onValueChange={(language) => {
                            if (language) {
                                setLanguage(language as "zh" | "en");
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

            <SettingsSection
                icon={Database}
                iconColor="text-orange-500"
                title={t("data_management")}
                description={t("data_management_desc")}
            >
                <SettingsItem label={t("data_management")}>
                    <SettingsActionButtons
                        actions={[
                            { id: "export", icon: Download, label: t("export"), onClick: handleExportData },
                            { id: "import", icon: Upload, label: t("import"), onClick: handleImportData },
                        ]}
                    />
                </SettingsItem>
            </SettingsSection>

            <SettingsSection
                icon={RotateCcw}
                iconColor="text-red-500"
                title={t("reset_data")}
                description={t("reset_data_desc")}
            >
                <SettingsItem label={t("reset_data")}>
                    <ResetButton />
                </SettingsItem>
            </SettingsSection>
        </div>
    );
}

function ResetButton() {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);

    const handleReset = () => {
        localStorage.clear();
        window.location.hash = "";
        window.location.reload();
    };

    return (
        <>
            <Button
                variant="destructive"
                size="sm"
                onClick={() => setOpen(true)}
                className="rounded-xl"
            >
                <RotateCcw size={14} className="mr-1.5" />
                {t("reset_data_btn")}
            </Button>
            <AlertDialog open={open} onOpenChange={setOpen}>
                <AlertDialogContent className="rounded-3xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("reset_data_confirm_title")}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t("reset_data_confirm_desc")}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel className="rounded-xl">{t("cancel")}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleReset}
                            className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {t("reset_data_confirm_btn")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

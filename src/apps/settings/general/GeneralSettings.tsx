import { useState, type Dispatch, type SetStateAction } from "react";
import { useTranslation } from "react-i18next";
import { ArrowDown, ArrowUp, Download, Pencil, Plus, RotateCcw, Settings2, Trash2, Upload } from "lucide-react";
import { useLanguagePreferenceStore, useSearchPreferenceStore } from "@/config";
import { APP_METADATA } from "@/shared/constants";
import { persistenceManager } from "@/platform/persistence/manager";
import { AppDialogV1Closable } from "@/platform/ui";
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
import {
    SETTINGS_ACTION_BUTTON_CLASS,
    SETTINGS_FIELD_CLASS,
    SettingsActionButtons,
    SettingsItem,
    SettingsSection,
} from "../components/SettingComponents";

export function GeneralSettings() {
    const { t } = useTranslation();
    const currentLanguage = useLanguagePreferenceStore((state) => state.language);
    const setLanguage = useLanguagePreferenceStore((state) => state.setLanguage);
    const searchEngine = useSearchPreferenceStore((state) => state.searchEngine);
    const setSearchEngine = useSearchPreferenceStore((state) => state.setSearchEngine);
    const searchEngines = useSearchPreferenceStore((state) => state.searchEngines);
    const addSearchEngine = useSearchPreferenceStore((state) => state.addSearchEngine);
    const moveSearchEngine = useSearchPreferenceStore((state) => state.moveSearchEngine);
    const removeSearchEngine = useSearchPreferenceStore((state) => state.removeSearchEngine);
    const updateSearchEngine = useSearchPreferenceStore((state) => state.updateSearchEngine);

    const [isManagerOpen, setIsManagerOpen] = useState(false);
    const [newEngine, setNewEngine] = useState({ name: "", url: "" });

    const languageOptions = {
        zh: t("language_name_zh"),
        en: t("language_name_en"),
    };
    const currentEngine = searchEngines.find((engine) => engine.value === searchEngine) || searchEngines[0];
    const canAddEngine = newEngine.name.trim().length > 0 && isValidSearchEngineUrl(newEngine.url);

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
        if (!canAddEngine) return;

        const value = `custom-${Date.now()}`;
        const url = newEngine.url.trim();

        addSearchEngine({
            name: newEngine.name.trim(),
            url,
            value,
            icon: getSearchEngineIcon(url),
        });
        setNewEngine({ name: "", url: "" });
    };

    return (
        <div className="mx-auto max-w-3xl space-y-6">
            <SettingsSection title={t("language")}>
                <SettingsItem label={t("language")}>
                    <Select
                        value={currentLanguage}
                        onValueChange={(language) => {
                            if (language) {
                                setLanguage(language as "zh" | "en");
                            }
                        }}
                    >
                        <SelectTrigger className={`${SETTINGS_FIELD_CLASS} w-[180px]`}>
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

            <SettingsSection title={t("search_engine")}>
                <div className="space-y-4">
                    <SettingsItem label={t("search_engine")}>
                        <Select value={searchEngine} onValueChange={(value) => value && setSearchEngine(value)}>
                            <SelectTrigger className={`${SETTINGS_FIELD_CLASS} w-[180px]`}>
                                <SelectValue>
                                    <div className="flex items-center gap-2">
                                        <img src={currentEngine.icon} alt="" className="h-3.5 w-3.5" />
                                        <span className="truncate">{currentEngine.name}</span>
                                    </div>
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px] overflow-x-hidden overflow-y-auto custom-scrollbar">
                                {searchEngines.map((engine) => (
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

                    <SettingsItem
                        label={t("manage_search_engines")}
                    >
                        <button
                            type="button"
                            onClick={() => setIsManagerOpen(true)}
                            className={`${SETTINGS_ACTION_BUTTON_CLASS} inline-flex items-center gap-1.5`}
                        >
                            <Settings2 size={14} />
                            <span>{t("manage")}</span>
                        </button>
                    </SettingsItem>
                </div>
            </SettingsSection>

            <SettingsSection title={t("data_management")}>
                <SettingsItem label={t("data_management")}>
                    <SettingsActionButtons
                        actions={[
                            { id: "export", icon: Download, label: t("export"), onClick: handleExportData },
                            { id: "import", icon: Upload, label: t("import"), onClick: handleImportData },
                        ]}
                    />
                </SettingsItem>
            </SettingsSection>

            <SettingsSection title={t("reset_data")}>
                <SettingsItem label={t("reset_data")}>
                    <ResetButton />
                </SettingsItem>
            </SettingsSection>

            <CustomSearchEnginesDialog
                open={isManagerOpen}
                onOpenChange={setIsManagerOpen}
                searchEngines={searchEngines}
                newEngine={newEngine}
                onNewEngineChange={setNewEngine}
                onAddEngine={handleAddEngine}
                onMoveEngine={moveSearchEngine}
                onRemoveEngine={removeSearchEngine}
                onUpdateEngine={updateSearchEngine}
                canAddEngine={canAddEngine}
            />
        </div>
    );
}

interface CustomSearchEnginesDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    searchEngines: Array<{
        value: string;
        name: string;
        url: string;
        icon?: string;
    }>;
    newEngine: {
        name: string;
        url: string;
    };
    onNewEngineChange: Dispatch<SetStateAction<{ name: string; url: string }>>;
    onAddEngine: () => void;
    onMoveEngine: (value: string, direction: "up" | "down") => void;
    onRemoveEngine: (value: string) => void;
    onUpdateEngine: (value: string, engine: { name?: string; url?: string; icon?: string }) => void;
    canAddEngine: boolean;
}

function CustomSearchEnginesDialog({
    open,
    onOpenChange,
    searchEngines,
    newEngine,
    onNewEngineChange,
    onAddEngine,
    onMoveEngine,
    onRemoveEngine,
    onUpdateEngine,
    canAddEngine,
}: CustomSearchEnginesDialogProps) {
    const { t } = useTranslation();
    const [editingValue, setEditingValue] = useState<string | null>(null);
    const [draftEngine, setDraftEngine] = useState({ name: "", url: "" });

    const canSaveEdit =
        draftEngine.name.trim().length > 0 &&
        isValidSearchEngineUrl(draftEngine.url);

    const startEditing = (engine: { value: string; name: string; url: string }) => {
        setEditingValue(engine.value);
        setDraftEngine({ name: engine.name, url: engine.url });
    };

    const stopEditing = () => {
        setEditingValue(null);
        setDraftEngine({ name: "", url: "" });
    };

    const saveEditing = () => {
        if (!editingValue || !canSaveEdit) return;

        onUpdateEngine(editingValue, {
            name: draftEngine.name.trim(),
            url: draftEngine.url.trim(),
            icon: getSearchEngineIcon(draftEngine.url.trim()),
        });
        stopEditing();
    };

    return (
        <AppDialogV1Closable
            open={open}
            onOpenChange={onOpenChange}
            title={t("manage_search_engines")}
            popupClassName="w-[min(92vw,46rem)] max-w-[46rem]"
            bodyClassName="space-y-4"
        >
            <div className="space-y-4">
                <div className="space-y-2">
                    {searchEngines.map((engine, index) => {
                        const isEditing = editingValue === engine.value;
                        const isFirst = index === 0;
                        const isLast = index === searchEngines.length - 1;

                        return (
                            <div
                                key={engine.value}
                                className="group/engine rounded-xl border border-border/65 bg-background/72 px-3 py-2.5"
                            >
                                {isEditing ? (
                                    <div className="space-y-3">
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/80">
                                                    {t("engine_name")}
                                                </label>
                                                <Input
                                                    value={draftEngine.name}
                                                    onChange={(event) =>
                                                        setDraftEngine((prev) => ({ ...prev, name: event.target.value }))
                                                    }
                                                    placeholder={t("engine_name_placeholder")}
                                                    className={SETTINGS_FIELD_CLASS}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/80">
                                                    {t("engine_url")}
                                                </label>
                                                <Input
                                                    value={draftEngine.url}
                                                    onChange={(event) =>
                                                        setDraftEngine((prev) => ({ ...prev, url: event.target.value }))
                                                    }
                                                    placeholder={t("engine_url_placeholder")}
                                                    className={`${SETTINGS_FIELD_CLASS} font-mono text-xs`}
                                                />
                                            </div>
                                        </div>

                                        <div className="flex justify-end gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={stopEditing}
                                                className={SETTINGS_ACTION_BUTTON_CLASS}
                                            >
                                                {t("cancel")}
                                            </Button>
                                            <Button
                                                type="button"
                                                size="sm"
                                                onClick={saveEditing}
                                                disabled={!canSaveEdit}
                                                className={SETTINGS_ACTION_BUTTON_CLASS}
                                            >
                                                {t("save")}
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex min-w-0 items-center gap-3">
                                            <img
                                                src={getSearchEngineIcon(engine.url, engine.icon)}
                                                alt=""
                                                className="h-4 w-4 rounded"
                                            />
                                            <div className="min-w-0">
                                                <div className="truncate text-sm font-semibold text-foreground">
                                                    {engine.name}
                                                </div>
                                                <div className="truncate font-mono text-[10px] text-muted-foreground/72">
                                                    {engine.url}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1">
                                            <button
                                                type="button"
                                                onClick={() => onMoveEngine(engine.value, "up")}
                                                disabled={isFirst}
                                                className="rounded-lg p-2 text-muted-foreground transition-all hover:bg-foreground/8 hover:text-foreground disabled:pointer-events-none disabled:opacity-35"
                                            >
                                                <ArrowUp size={14} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => onMoveEngine(engine.value, "down")}
                                                disabled={isLast}
                                                className="rounded-lg p-2 text-muted-foreground transition-all hover:bg-foreground/8 hover:text-foreground disabled:pointer-events-none disabled:opacity-35"
                                            >
                                                <ArrowDown size={14} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => startEditing(engine)}
                                                className="rounded-lg p-2 text-muted-foreground transition-all hover:bg-foreground/8 hover:text-foreground"
                                            >
                                                <Pencil size={14} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (editingValue === engine.value) {
                                                        stopEditing();
                                                    }
                                                    onRemoveEngine(engine.value);
                                                }}
                                                disabled={searchEngines.length <= 1}
                                                className="rounded-lg p-2 text-muted-foreground transition-all hover:bg-foreground/8 hover:text-foreground disabled:pointer-events-none disabled:opacity-35"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                        <label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/80">
                            {t("engine_name")}
                        </label>
                        <Input
                            value={newEngine.name}
                            onChange={(event) =>
                                onNewEngineChange((prev) => ({ ...prev, name: event.target.value }))
                            }
                            placeholder={t("engine_name_placeholder")}
                            className={SETTINGS_FIELD_CLASS}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/80">
                            {t("engine_url")}
                        </label>
                        <Input
                            value={newEngine.url}
                            onChange={(event) =>
                                onNewEngineChange((prev) => ({ ...prev, url: event.target.value }))
                            }
                            placeholder={t("engine_url_placeholder")}
                            className={`${SETTINGS_FIELD_CLASS} font-mono text-xs`}
                        />
                    </div>
                </div>

                <div className="flex justify-end">
                    <Button
                        type="button"
                        size="sm"
                        onClick={onAddEngine}
                        disabled={!canAddEngine}
                        className={SETTINGS_ACTION_BUTTON_CLASS}
                    >
                        <Plus size={14} className="mr-1.5" />
                        {t("add_search_engine")}
                    </Button>
                </div>
            </div>
        </AppDialogV1Closable>
    );
}

function isValidSearchEngineUrl(value: string) {
    try {
        const url = new URL(value.trim());
        return url.protocol === "https:" || url.protocol === "http:";
    } catch {
        return false;
    }
}

function getSearchEngineIcon(url: string, icon?: string) {
    if (icon) {
        return icon;
    }

    try {
        return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=64`;
    } catch {
        return "";
    }
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
                className="h-9 rounded-xl px-3"
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

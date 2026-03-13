import { useUIStore } from "@/shell/launcher/store/ui";
import { useItemStore } from "@/shell/launcher/store/item";
import { Edit2, FolderPlus, Trash2, LayoutGrid, Sun, Moon, Store } from "lucide-react";
import { cn } from "@/core/utils";
import { useState } from "react";
import { useSettingsStore } from "@/apps/settings/store";
import { useTranslation } from "react-i18next";
import AppSurface from "@/components/surface/AppSurface";
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

export function HomeTools() {
    const { t } = useTranslation();
    const { isEditing, toggleEditing, selectedTagIds, clearSelection, setActiveSystemDialog } = useUIStore();
    const { batchGroupItems, batchRemoveItems, organizeItems } = useItemStore();
    const theme = useSettingsStore((s) => s.theme);
    const setTheme = useSettingsStore((s) => s.setTheme);
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    const handleToggleTheme = () => {
        setTheme(isDark ? 'light' : 'dark');
    };
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const handleBatchGroup = () => {
        if (selectedTagIds.length <= 1) return;

        batchGroupItems(selectedTagIds, t('new_folder'));
        clearSelection();
        toggleEditing();
    };

    const handleBatchDelete = () => {
        batchRemoveItems(selectedTagIds);
        clearSelection();
        setIsDeleteDialogOpen(false);
        toggleEditing();
    };

    const handleOrganize = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        event.stopPropagation();
        organizeItems();
    };

    const neutralToolButtonClass = "p-2.5 glass-button rounded-xl border border-black/10 dark:border-white/20 text-black/85 hover:text-black dark:text-white/90 dark:hover:text-white active:scale-95";

    return (
        <AppSurface variant="toolbar" width="auto" height="auto" className="pointer-events-auto">
            <div className="group flex items-center gap-3 px-2 py-1.5">
                {/* 鎵归噺鎿嶄綔鎸夐挳缁?*/}
                {isEditing && selectedTagIds.length > 0 && (
                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-500">
                        {selectedTagIds.length > 1 && (
                            <button
                                onClick={handleBatchGroup}
                                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl transition-all shadow-xl shadow-primary/20 hover:brightness-110 active:scale-95"
                                title={t('group_selected')}
                            >
                                <FolderPlus size={16} strokeWidth={2.5} />
                                <span className="hidden sm:inline text-xs font-bold uppercase tracking-wider">
                                    {t('group_button', { count: selectedTagIds.length })}
                                </span>
                            </button>
                        )}

                        <button
                            onClick={() => setIsDeleteDialogOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-destructive text-destructive-foreground rounded-xl transition-all shadow-xl shadow-destructive/20 hover:brightness-110 active:scale-95"
                            title={t('delete_selected')}
                        >
                            <Trash2 size={16} strokeWidth={2.5} />
                            <span className="hidden sm:inline text-xs font-bold uppercase tracking-wider">
                                {t('delete_button', { count: selectedTagIds.length })}
                            </span>
                        </button>

                        <div className="w-px h-6 bg-border/50 mx-1" />
                    </div>
                )}

                <button
                    onClick={toggleEditing}
                    className={cn(
                        "p-2.5 rounded-xl transition-all shadow-sm border backdrop-blur-md active:scale-95",
                        isEditing
                            ? "bg-primary text-white border-primary shadow-xl shadow-primary/20"
                            : neutralToolButtonClass
                    )}
                    title={isEditing ? t('exit_edit_mode') : t('enter_edit_mode')}
                >
                    <Edit2 size={18} className="text-current" />
                </button>

                <button
                    onClick={handleOrganize}
                    className={neutralToolButtonClass}
                    title={t('organize_icons')}
                >
                    <LayoutGrid size={18} className="text-current" />
                </button>

                <button
                    onClick={handleToggleTheme}
                    className={neutralToolButtonClass}
                    title={isDark ? t('switch_to_light') : t('switch_to_dark')}
                >
                    {isDark ? <Sun size={18} className="text-current" /> : <Moon size={18} className="text-current" />}
                </button>

                <button
                    onClick={() => setActiveSystemDialog('component-market')}
                    className={neutralToolButtonClass}
                    title={t('app_market')}
                >
                    <Store size={18} className="text-current" />
                </button>

                {/* 鎵归噺鍒犻櫎纭瀵硅瘽妗?*/}
                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <AlertDialogContent className="glass-card border-none rounded-3xl">
                        <AlertDialogHeader>
                            <AlertDialogTitle>{t('delete_multiple_title')}</AlertDialogTitle>
                            <AlertDialogDescription>
                                {t('delete_multiple_desc', { count: selectedTagIds.length })}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="gap-2">
                            <AlertDialogCancel className="rounded-xl border-none bg-secondary hover:bg-secondary/80">{t('cancel')}</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleBatchDelete}
                                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-xl"
                            >
                                {t('delete_all')}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </AppSurface>
    );
}

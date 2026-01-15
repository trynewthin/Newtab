import { useUIStore } from "@/store/modules/ui";
import { useTagStore } from "@/store/modules/tag";
import { Edit2, FolderPlus, Trash2, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useTranslation } from "react-i18next";
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
    const { batchGroupTags, batchRemoveTags } = useTagStore();
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const handleBatchGroup = () => {
        if (selectedTagIds.length <= 1) return;

        batchGroupTags(selectedTagIds, t('new_folder'));
        clearSelection();
        toggleEditing();
    };

    const handleBatchDelete = () => {
        batchRemoveTags(selectedTagIds);
        clearSelection();
        setIsDeleteDialogOpen(false);
        toggleEditing();
    };

    return (
        <div className="flex items-center gap-3 p-1.5 glass-card rounded-2xl shadow-lg border-white/40 pointer-events-auto">
            {/* 批量操作按钮组 */}
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
                        ? "bg-primary text-primary-foreground border-primary shadow-xl shadow-primary/20"
                        : "glass-button"
                )}
                title={isEditing ? t('exit_edit_mode') : t('enter_edit_mode')}
            >
                <Edit2 size={18} className={isEditing ? "text-primary-foreground" : "text-foreground/70"} />
            </button>

            <button
                onClick={() => setActiveSystemDialog('settings')}
                className="p-2.5 glass-button rounded-xl active:scale-90"
                title={t('settings')}
            >
                <Settings size={18} className="text-foreground/70" />
            </button>

            {/* 批量删除确认对话框 */}
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
    );
}

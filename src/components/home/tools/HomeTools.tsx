import { useUIStore } from "@/store/modules/ui";
import { useTagStore } from "@/store/modules/tag";
import { Edit2, Grid3x3, FolderPlus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { ConfigDialog } from "@/components/items/config-dialog";
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
    const { isEditing, toggleEditing, selectedTagIds, clearSelection } = useUIStore();
    const { batchGroupTags, batchRemoveTags } = useTagStore();
    const [isIconManagerOpen, setIsIconManagerOpen] = useState(false);
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
        <div className="flex items-center gap-2">
            {/* 批量操作按钮组 */}
            {isEditing && selectedTagIds.length > 0 && (
                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
                    {selectedTagIds.length > 1 && (
                        <button
                            onClick={handleBatchGroup}
                            className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg transition-all shadow-lg border border-primary hover:brightness-110 active:scale-95"
                            title={t('group_selected')}
                        >
                            <FolderPlus size={18} />
                            <span className="hidden sm:inline text-sm font-medium">
                                {t('group_button', { count: selectedTagIds.length })}
                            </span>
                        </button>
                    )}

                    <button
                        onClick={() => setIsDeleteDialogOpen(true)}
                        className="flex items-center gap-2 px-3 py-2 bg-destructive text-destructive-foreground rounded-lg transition-all shadow-lg border border-destructive hover:brightness-110 active:scale-95"
                        title={t('delete_selected')}
                    >
                        <Trash2 size={18} />
                        <span className="hidden sm:inline text-sm font-medium">
                            {t('delete_button', { count: selectedTagIds.length })}
                        </span>
                    </button>
                </div>
            )}

            <button
                onClick={() => setIsIconManagerOpen(true)}
                className="p-2 bg-secondary/80 hover:bg-secondary text-secondary-foreground rounded-lg transition-all shadow-sm border backdrop-blur-sm active:scale-95"
                title={t('manage_icons')}
            >
                <Grid3x3 size={18} />
            </button>

            <button
                onClick={toggleEditing}
                className={cn(
                    "p-2 rounded-lg transition-all shadow-sm border backdrop-blur-sm active:scale-95",
                    isEditing
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-secondary/80 hover:bg-secondary text-secondary-foreground"
                )}
                title={isEditing ? t('exit_edit_mode') : t('enter_edit_mode')}
            >
                <Edit2 size={18} />
            </button>

            <ConfigDialog
                open={isIconManagerOpen}
                onOpenChange={setIsIconManagerOpen}
                defaultTab="system"
            />

            {/* 批量删除确认对话框 */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('delete_multiple_title')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('delete_multiple_desc', { count: selectedTagIds.length })}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleBatchDelete}
                            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                        >
                            {t('delete_all')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

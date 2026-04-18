import type { GridItem as GridItemType, WebTagItem } from "@/launcher/model/itemTypes";
import { ShortcutDialog } from "@/launcher/ui/dialogs/ShortcutDialog";
import { FolderPreview } from "@/launcher/ui/folder/FolderPreview";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogMedia,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertCircle, Trash2, UnfoldVertical } from "lucide-react";
import { useTranslation } from "react-i18next";

interface LauncherGridOverlaysProps {
    isEditDialogOpen: boolean;
    onEditDialogOpenChange: (open: boolean) => void;
    editingItem: WebTagItem | null;
    openFolder: GridItemType | null;
    onCloseFolder: () => void;
    onClickFolderItem: (item: GridItemType) => void;
    onDeletePrompt: (item: GridItemType) => void;
    deleteTarget: GridItemType | null;
    onDismissDeleteTarget: () => void;
    onConfirmUngroup: () => void;
    onConfirmDelete: () => void;
}

export function LauncherGridOverlays({
    isEditDialogOpen,
    onEditDialogOpenChange,
    editingItem,
    openFolder,
    onCloseFolder,
    onClickFolderItem,
    onDeletePrompt,
    deleteTarget,
    onDismissDeleteTarget,
    onConfirmUngroup,
    onConfirmDelete,
}: LauncherGridOverlaysProps) {
    const { t } = useTranslation();

    return (
        <>
            <ShortcutDialog
                open={isEditDialogOpen}
                onOpenChange={onEditDialogOpenChange}
                editTag={editingItem}
            />

            {openFolder ? (
                <FolderPreview
                    folder={openFolder}
                    onClose={onCloseFolder}
                    onClickTag={onClickFolderItem}
                    onDeletePrompt={onDeletePrompt}
                />
            ) : null}

            <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && onDismissDeleteTarget()}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogMedia className={deleteTarget?.kind === "folder" ? "bg-primary/10 text-primary" : "bg-rose-500/10 text-rose-500"}>
                            {deleteTarget?.kind === "folder" ? <UnfoldVertical /> : <AlertCircle />}
                        </AlertDialogMedia>
                        <AlertDialogTitle>
                            {deleteTarget?.kind === "folder" ? t("manage_folder") : t("delete_shortcut")}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {deleteTarget?.kind === "folder"
                                ? t("delete_folder_desc", { title: deleteTarget.title })
                                : t("delete_shortcut_confirm", { title: deleteTarget?.title })}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>

                        {deleteTarget?.kind === "folder" ? (
                            <AlertDialogAction
                                onClick={onConfirmUngroup}
                                className="bg-primary hover:bg-primary/90"
                            >
                                <UnfoldVertical className="mr-2 size-4" />
                                {t("ungroup")}
                            </AlertDialogAction>
                        ) : null}

                        <AlertDialogAction
                            onClick={onConfirmDelete}
                            className="bg-rose-500 hover:bg-rose-600 shadow-rose-500/10"
                        >
                            <Trash2 className="mr-2 size-4" />
                            {deleteTarget?.kind === "folder" ? t("delete_all") : t("delete")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

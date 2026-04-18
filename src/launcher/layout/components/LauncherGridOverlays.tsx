import type {
    GridItem as GridItemType,
    LauncherWidgetItem as LauncherWidgetRecord,
    WebTagItem,
} from "@/launcher/model/itemTypes";
import { ShortcutDialog } from "@/launcher/ui/dialogs/ShortcutDialog";
import { WidgetConfigDialog } from "@/launcher/ui/dialogs/WidgetConfigDialog";
import { FolderPreview } from "@/launcher/ui/folder/FolderPreview";
import { AppDialogV1Closable } from "@/platform/ui";
import { AppWindow, PanelTop, Trash2, UnfoldVertical } from "lucide-react";
import { cn } from "@/shared/utils";
import { useTranslation } from "react-i18next";

interface LauncherGridOverlaysProps {
    isEditDialogOpen: boolean;
    onEditDialogOpenChange: (open: boolean) => void;
    editingItem: WebTagItem | null;
    editingWidget: LauncherWidgetRecord | null;
    onWidgetEditDialogOpenChange: (open: boolean) => void;
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
    editingWidget,
    onWidgetEditDialogOpenChange,
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
    const deleteDialogConfig = deleteTarget ? getDeleteDialogConfig(deleteTarget, t) : null;

    return (
        <>
            <ShortcutDialog
                open={isEditDialogOpen}
                onOpenChange={onEditDialogOpenChange}
                editTag={editingItem}
            />

            <WidgetConfigDialog
                open={!!editingWidget}
                onOpenChange={onWidgetEditDialogOpenChange}
                item={editingWidget}
            />

            {openFolder ? (
                <FolderPreview
                    folder={openFolder}
                    onClose={onCloseFolder}
                    onClickTag={onClickFolderItem}
                    onDeletePrompt={onDeletePrompt}
                />
            ) : null}

            <AppDialogV1Closable
                open={!!deleteTarget}
                onOpenChange={(open) => !open && onDismissDeleteTarget()}
                title={deleteDialogConfig?.title ?? ""}
                closeLabel={t("close")}
                popupClassName="w-[min(92vw,30rem)]"
                bodyClassName="space-y-5"
            >
                {deleteDialogConfig ? (
                    <>
                        <div className="flex items-start gap-4">
                            <div
                                className={cn(
                                    "flex size-11 shrink-0 items-center justify-center rounded-2xl",
                                    deleteDialogConfig.mediaClassName
                                )}
                            >
                                <deleteDialogConfig.icon className="size-5" />
                            </div>

                            <div className="space-y-2 pt-1">
                                <div className="text-sm leading-relaxed text-muted-foreground">
                                    {deleteDialogConfig.description}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap justify-end gap-2">
                            <button
                                type="button"
                                onClick={onDismissDeleteTarget}
                                className="h-9 rounded-xl border border-border/70 bg-background/85 px-3 text-sm font-medium text-foreground/85 transition-colors hover:bg-foreground/6 hover:text-foreground"
                            >
                                {t("cancel")}
                            </button>

                            {deleteTarget?.kind === "folder" ? (
                                <button
                                    type="button"
                                    onClick={onConfirmUngroup}
                                    className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-primary px-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                                >
                                    <UnfoldVertical className="size-4" />
                                    {t("ungroup")}
                                </button>
                            ) : null}

                            <button
                                type="button"
                                onClick={onConfirmDelete}
                                className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-rose-500 px-3 text-sm font-medium text-white transition-colors hover:bg-rose-600"
                            >
                                <Trash2 className="size-4" />
                                {deleteDialogConfig.confirmLabel}
                            </button>
                        </div>
                    </>
                ) : null}
            </AppDialogV1Closable>
        </>
    );
}

function getDeleteDialogConfig(
    target: GridItemType,
    t: (key: string, options?: Record<string, unknown>) => string
) {
    const displayTitle = resolveDeleteTargetTitle(target, t);

    if (target.kind === "folder") {
        return {
            title: t("manage_folder"),
            description: t("delete_folder_desc", { title: displayTitle }),
            confirmLabel: t("delete_all"),
            icon: UnfoldVertical,
            mediaClassName: "bg-primary/10 text-primary",
        };
    }

    if (target.kind === "widget") {
        return {
            title: t("delete_widget"),
            description: t("delete_widget_confirm", { title: displayTitle }),
            confirmLabel: t("delete_widget"),
            icon: PanelTop,
            mediaClassName: "bg-amber-500/10 text-amber-500",
        };
    }

    return {
        title: t("delete_icon"),
        description: t("delete_icon_confirm", { title: displayTitle }),
        confirmLabel: t("delete_icon"),
        icon: AppWindow,
        mediaClassName: "bg-rose-500/10 text-rose-500",
    };
}

function resolveDeleteTargetTitle(
    target: GridItemType,
    t: (key: string, options?: Record<string, unknown>) => string
) {
    if (target.kind === "widget") {
        return t(target.title);
    }

    if (target.kind === "app" && target.title.startsWith("sys_")) {
        return t(target.title);
    }

    return target.title;
}

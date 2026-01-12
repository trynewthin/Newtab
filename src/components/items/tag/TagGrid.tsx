import { useState, useRef, useCallback } from "react";
import { useTagStore } from "@/store/modules/tag";
import { type Tag } from "@/store/core/types";
import { TagItem } from "./TagItem";
import { FolderItem } from "@/components/items/folder/FolderItem";
import { ConfigDialog } from "@/components/items/config-dialog";
import { SystemDialogHost, type SystemType } from "@/components/items";
import { FolderPreview } from "@/components/items/folder/FolderPreview";
import { useTranslation } from "react-i18next";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    type DragStartEvent,
    type DragOverEvent,
    type DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
} from "@dnd-kit/sortable";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Trash2, UnfoldVertical } from "lucide-react";

const HOVER_DELAY = 1000;
const DETECTION_RADIUS = 75;
const MERGE_RADIUS = 48;

export function TagGrid() {
    const { t } = useTranslation();
    const { tags, setTags, removeTag, ungroupFolder } = useTagStore();
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingTag, setEditingTag] = useState<Tag | null>(null);
    const [activeSystemDialog, setActiveSystemDialog] = useState<SystemType | null>(null);
    const [activeTag, setActiveTag] = useState<Tag | null>(null);
    const [hoverTarget, setHoverTarget] = useState<string | null>(null);
    const [nearTarget, setNearTarget] = useState<string | null>(null);
    const [openFolder, setOpenFolder] = useState<Tag | null>(null);

    // 删除相关的状态
    const [deleteTarget, setDeleteTarget] = useState<Tag | null>(null);

    const hoverTimerRef = useRef<number | null>(null);
    const scoringTargetRef = useRef<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const addToFolder = useCallback((tagId: string, folderId: string) => {
        const tag = tags.find(t => t.id === tagId);
        const folder = tags.find(t => t.id === folderId);
        if (!tag || !folder || !folder.isFolder) return;
        if (tag.isFolder) return;

        const updatedFolder: Tag = {
            ...folder,
            children: [...(folder.children || []), tag],
        };
        const newTags = tags.map(t =>
            t.id === folderId ? updatedFolder : t
        ).filter(t => t.id !== tagId);
        setTags(newTags);
    }, [tags, setTags]);

    const createFolder = useCallback((tag1Id: string, tag2Id: string) => {
        const tag1 = tags.find(t => t.id === tag1Id);
        const tag2 = tags.find(t => t.id === tag2Id);
        if (!tag1 || !tag2) return;

        if (tag2.isFolder) {
            addToFolder(tag1Id, tag2Id);
            return;
        }
        if (tag1.isFolder) {
            addToFolder(tag2Id, tag1Id);
            return;
        }

        const folderId = `folder_${Date.now()}`;
        const newFolder: Tag = {
            id: folderId,
            title: "New Folder",
            url: "#",
            isFolder: true,
            type: "folder",
            children: [tag1, tag2],
        };

        const newTags = tags.filter(t => t.id !== tag1Id && t.id !== tag2Id);
        const tag2Index = tags.findIndex(t => t.id === tag2Id);
        newTags.splice(tag2Index, 0, newFolder);
        setTags(newTags);
    }, [tags, setTags, addToFolder]);

    const handleTagClick = (tag: Tag) => {
        if (tag.isFolder) {
            setOpenFolder(tag);
            return;
        }
        if (tag.isSystem) {
            setActiveSystemDialog(tag.type as SystemType);
        }
    };

    const handleEditClick = (tag: Tag) => {
        if (tag.isSystem || tag.isFolder) return;
        setEditingTag(tag);
        setIsEditDialogOpen(true);
    };

    const handleDeletePrompt = (tag: Tag) => {
        setDeleteTarget(tag);
    };

    const confirmDeleteItems = () => {
        if (!deleteTarget) return;
        removeTag(deleteTarget.id);
        setDeleteTarget(null);
    };

    const confirmUngroupItems = () => {
        if (!deleteTarget || !deleteTarget.isFolder) return;
        ungroupFolder(deleteTarget.id);
        setDeleteTarget(null);
    };

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const tag = tags.find(t => t.id === active.id);
        if (tag) setActiveTag(tag);
        cancelMergeTimer();
    };

    const cancelMergeTimer = useCallback(() => {
        if (hoverTimerRef.current) {
            clearTimeout(hoverTimerRef.current);
            hoverTimerRef.current = null;
        }
        setHoverTarget(null);
        setNearTarget(null);
        scoringTargetRef.current = null;
    }, []);

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;

        if (!over || active.id === over.id) {
            cancelMergeTimer();
            return;
        }

        if (nearTarget && nearTarget !== over.id) {
            cancelMergeTimer();
        }

        const activeRect = active.rect.current.translated;
        const overRect = over.rect;

        let distance = Infinity;
        if (activeRect && overRect) {
            const activeCenter = {
                x: activeRect.left + activeRect.width / 2,
                y: activeRect.top + activeRect.height / 2,
            };
            const overCenter = {
                x: overRect.left + overRect.width / 2,
                y: overRect.top + overRect.height / 2,
            };

            distance = Math.sqrt(
                Math.pow(activeCenter.x - overCenter.x, 2) +
                Math.pow(activeCenter.y - overCenter.y, 2)
            );
        }

        const isActuallyNear = distance < DETECTION_RADIUS;
        const isCoreMerge = distance < MERGE_RADIUS;

        if (isActuallyNear) {
            setNearTarget(over.id as string);

            if (isCoreMerge) {
                if (scoringTargetRef.current !== over.id) {
                    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
                    scoringTargetRef.current = over.id as string;
                    setHoverTarget(null);

                    hoverTimerRef.current = setTimeout(() => {
                        setHoverTarget(over.id as string);
                    }, HOVER_DELAY) as unknown as number;
                }
            } else {
                if (hoverTimerRef.current) {
                    clearTimeout(hoverTimerRef.current);
                    hoverTimerRef.current = null;
                }
                setHoverTarget(null);
                scoringTargetRef.current = null;
            }
        } else {
            cancelMergeTimer();
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const activeTag = tags.find(t => t.id === active.id);
            const overTag = tags.find(t => t.id === over.id);

            if (hoverTarget === over.id && activeTag && overTag) {
                createFolder(active.id as string, over.id as string);
            } else {
                const oldIndex = tags.findIndex((t) => t.id === active.id);
                const newIndex = tags.findIndex((t) => t.id === over.id);
                if (oldIndex !== -1 && newIndex !== -1) {
                    setTags(arrayMove(tags, oldIndex, newIndex));
                }
            }
        }

        cancelMergeTimer();
        setActiveTag(null);
    };

    return (
        <div className="w-full h-full pb-8 px-4 pt-3 overflow-y-auto [scrollbar-gutter:stable]">
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
                onDragCancel={() => {
                    cancelMergeTimer();
                    setActiveTag(null);
                }}
            >
                <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-9 lg:grid-cols-10 xl:grid-cols-12 gap-4">
                    <SortableContext
                        items={tags.map(t => t.id)}
                        strategy={rectSortingStrategy}
                    >
                        {tags.map((tag) => {
                            const isHoverTarget = hoverTarget === tag.id;
                            const isNearTarget = nearTarget === tag.id && !isHoverTarget;

                            return (
                                <div key={tag.id} className="relative">
                                    {tag.isFolder ? (
                                        <FolderItem
                                            tag={tag}
                                            onEdit={handleEditClick}
                                            onClick={handleTagClick}
                                            onDeletePrompt={handleDeletePrompt}
                                            isNearTarget={isNearTarget || isHoverTarget}
                                            isHoverTarget={isHoverTarget}
                                        />
                                    ) : (
                                        <TagItem
                                            tag={tag}
                                            onEdit={handleEditClick}
                                            onClick={handleTagClick}
                                            onDeletePrompt={handleDeletePrompt}
                                            isNearTarget={isNearTarget || isHoverTarget}
                                            isHoverTarget={isHoverTarget}
                                        />
                                    )}
                                    {isNearTarget && (
                                        <div className="absolute inset-x-0 -inset-y-1 rounded-2xl bg-white/5 border border-dashed border-white/20 pointer-events-none z-0 transition-opacity duration-150" />
                                    )}
                                    {isHoverTarget && (
                                        <div className="absolute inset-0 rounded-2xl bg-white/20 ring-4 ring-white/40 animate-pulse pointer-events-none z-10 scale-105 transition-all duration-200" />
                                    )}
                                </div>
                            );
                        })}
                    </SortableContext>
                </div>

                <DragOverlay dropAnimation={null}>
                    {activeTag ? (
                        activeTag.isFolder ? (
                            <FolderItem
                                tag={activeTag}
                                onEdit={() => { }}
                                onClick={() => { }}
                                onDeletePrompt={() => { }}
                                isOverlay
                            />
                        ) : (
                            <TagItem
                                tag={activeTag}
                                onEdit={() => { }}
                                onClick={() => { }}
                                onDeletePrompt={() => { }}
                                isOverlay
                            />
                        )
                    ) : null}
                </DragOverlay>
            </DndContext>

            {/* 编辑对话框 */}
            <ConfigDialog
                open={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
                editTag={editingTag}
            />

            {/* 系统对话框 */}
            <SystemDialogHost
                active={activeSystemDialog}
                onActiveChange={setActiveSystemDialog}
            />

            {/* 文件夹预览 */}
            {openFolder && (
                <FolderPreview
                    folder={openFolder}
                    onClose={() => setOpenFolder(null)}
                    onClickTag={handleTagClick}
                    onDeletePrompt={handleDeletePrompt}
                />
            )}

            {/* 全局删除/取消组合确认对话框 */}
            <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {deleteTarget?.isFolder ? t('manage_folder') : t('delete_shortcut')}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {deleteTarget?.isFolder
                                ? t('delete_folder_desc', { title: deleteTarget.title })
                                : t('delete_shortcut_confirm', { title: deleteTarget?.title })}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="sm:justify-between gap-y-2">
                        <div className="flex gap-2 w-full sm:w-auto">
                            <AlertDialogCancel className="flex-1 sm:flex-none">{t('cancel')}</AlertDialogCancel>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                            {deleteTarget?.isFolder && (
                                <AlertDialogAction
                                    onClick={confirmUngroupItems}
                                    className="bg-primary hover:bg-primary/90 flex-1 sm:flex-none"
                                >
                                    <UnfoldVertical className="mr-2 size-4" />
                                    {t('ungroup')}
                                </AlertDialogAction>
                            )}
                            <AlertDialogAction
                                onClick={confirmDeleteItems}
                                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground flex-1 sm:flex-none"
                            >
                                <Trash2 className="mr-2 size-4" />
                                {deleteTarget?.isFolder ? t('delete_all') : t('delete')}
                            </AlertDialogAction>
                        </div>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

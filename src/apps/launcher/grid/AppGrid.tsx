import { useState, useRef, useCallback } from "react";
import { useItemStore } from "@/apps/launcher/store/item";
import { useUIStore } from "@/apps/launcher/store/ui";
import type { GridItem as GridItemType } from "@/platform/state/core/itemTypes";
import { GridItem } from "../item/GridItem";

import { ShortcutDialog } from "../tag/ShortcutDialog";
import { SystemDialogHost } from "../system/SystemDialogHost";
import { isSystemAppId } from "../system/appManifest";
import { useAppLauncher } from "../system/useAppLauncher";

import { FolderPreview } from "../folder/FolderPreview";

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
    AlertDialogTitle,
    AlertDialogMedia,
} from "@/platform/shared/ui/alert-dialog";
import { Trash2, UnfoldVertical, AlertCircle } from "lucide-react";

const HOVER_DELAY = 1000;
const DETECTION_RADIUS = 75;
const MERGE_RADIUS = 55;

export function AppGrid() {
    const { t } = useTranslation();

    const { items, setItems, removeItem, ungroupFolder, batchGroupItems } = useItemStore();

    const { activeSystemDialog, setActiveSystemDialog } = useUIStore();
    const { launchApp } = useAppLauncher();

    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<GridItemType | null>(null);
    const [activeItem, setActiveItem] = useState<GridItemType | null>(null);
    const [hoverTarget, setHoverTarget] = useState<string | null>(null);
    const [nearTarget, setNearTarget] = useState<string | null>(null);
    const [openFolder, setOpenFolder] = useState<GridItemType | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<GridItemType | null>(null);

    const hoverTimerRef = useRef<number | null>(null);
    const scoringTargetRef = useRef<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const createFolder = useCallback((item1Id: string, item2Id: string) => {
        batchGroupItems([item1Id, item2Id], t('new_folder'));
    }, [batchGroupItems, t]);

    const handleItemClick = (item: GridItemType, event?: React.MouseEvent) => {
        if (item.kind === 'folder') {
            setOpenFolder(item);
            return;
        }
        if (item.kind === 'app') {
            if (!isSystemAppId(item.appId)) {
                return;
            }

            launchApp(item.appId, {
                ctrlKey: event?.ctrlKey,
                metaKey: event?.metaKey,
                altKey: event?.altKey,
            });
            return;
        }
        // Handle tag (bookmark) clicks
        if (item.kind === 'tag' && item.url) {
            window.open(item.url, '_blank');
        }
    };

    const handleEditClick = (item: GridItemType) => {
        if (item.kind === 'app' || item.kind === 'folder') return;
        setEditingItem(item);
        setIsEditDialogOpen(true);
    };

    const handleDeletePrompt = (item: GridItemType) => {
        setDeleteTarget(item);
    };

    const confirmDeleteItems = () => {
        if (!deleteTarget) return;
        removeItem(deleteTarget.id);
        setDeleteTarget(null);
    };

    const confirmUngroupItems = () => {
        if (!deleteTarget || deleteTarget.kind !== 'folder') return;
        ungroupFolder(deleteTarget.id);
        setDeleteTarget(null);
    };

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const item = items.find(t => t.id === active.id);
        if (item) setActiveItem(item);
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
            const activeItem = items.find(t => t.id === active.id);
            const overItem = items.find(t => t.id === over.id);

            if (hoverTarget === over.id && activeItem && overItem) {
                createFolder(active.id as string, over.id as string);
            } else {
                const oldIndex = items.findIndex((t) => t.id === active.id);
                const newIndex = items.findIndex((t) => t.id === over.id);
                if (oldIndex !== -1 && newIndex !== -1) {
                    setItems(arrayMove(items, oldIndex, newIndex));
                }
            }
        }

        cancelMergeTimer();
        setActiveItem(null);
    };

    return (
        <div className="w-full h-full pb-8 px-4 pt-8 overflow-y-auto custom-scrollbar pointer-events-auto">
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
                onDragCancel={() => {
                    cancelMergeTimer();
                    setActiveItem(null);
                }}
            >
                <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-9 lg:grid-cols-10 xl:grid-cols-12 gap-4">
                    <SortableContext items={items.map(t => t.id)} strategy={rectSortingStrategy}>
                        {items.map((item) => {
                            const isHoverTarget = hoverTarget === item.id;
                            const isNearTarget = nearTarget === item.id && !isHoverTarget;

                            return (
                                <div key={item.id} className="flex justify-center">
                                    <div className="relative w-14">
                                        <GridItem
                                            item={item}
                                            onClick={handleItemClick}
                                            onEdit={handleEditClick}
                                            onDeletePrompt={handleDeletePrompt}
                                            isNearTarget={isNearTarget || isHoverTarget}
                                            isHoverTarget={isHoverTarget}
                                        />

                                        {isNearTarget && (
                                            <div className="absolute -inset-2 rounded-2xl bg-white/5 border border-dashed border-white/20 pointer-events-none z-0 transition-opacity duration-150" />
                                        )}
                                        {isHoverTarget && (
                                            <div className="absolute -inset-2 rounded-2xl bg-white/20 ring-4 ring-white/40 animate-pulse pointer-events-none z-10 scale-105 transition-all duration-200" />
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </SortableContext>
                </div>

                <DragOverlay dropAnimation={null}>
                    {activeItem ? (
                        <GridItem
                            item={activeItem}
                            isOverlay
                        />
                    ) : null}
                </DragOverlay>
            </DndContext>

            <ShortcutDialog
                open={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
                editTag={editingItem as any}
            />

            <SystemDialogHost
                active={activeSystemDialog}
                onActiveChange={setActiveSystemDialog}
            />

            {openFolder && (
                <FolderPreview
                    folder={openFolder}
                    onClose={() => setOpenFolder(null)}
                    onClickTag={handleItemClick}
                    onDeletePrompt={handleDeletePrompt}
                />
            )}

            <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogMedia className={deleteTarget?.kind === 'folder' ? 'bg-primary/10 text-primary' : 'bg-rose-500/10 text-rose-500'}>
                            {deleteTarget?.kind === 'folder' ? <UnfoldVertical /> : <AlertCircle />}
                        </AlertDialogMedia>
                        <AlertDialogTitle>
                            {deleteTarget?.kind === 'folder' ? t('manage_folder') : t('delete_shortcut')}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {deleteTarget?.kind === 'folder'
                                ? t('delete_folder_desc', { title: deleteTarget.title })
                                : t('delete_shortcut_confirm', { title: deleteTarget?.title })}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>

                        {deleteTarget?.kind === 'folder' && (
                            <AlertDialogAction
                                onClick={confirmUngroupItems}
                                className="bg-primary hover:bg-primary/90"
                            >
                                <UnfoldVertical className="mr-2 size-4" />
                                {t('ungroup')}
                            </AlertDialogAction>
                        )}

                        <AlertDialogAction
                            onClick={confirmDeleteItems}
                            className="bg-rose-500 hover:bg-rose-600 shadow-rose-500/10"
                        >
                            <Trash2 className="mr-2 size-4" />
                            {deleteTarget?.kind === 'folder' ? t('delete_all') : t('delete')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}


import { useItemStore } from "@/launcher/store/item";
import { type GridItem as GridItemType, type FolderItem, type WebTagItem, type SystemAppItem } from "@/launcher/model/itemTypes";
import { GridItem } from "@/launcher/layout/GridItem";
import {
    DndContext,
    pointerWithin,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    type DragStartEvent,
    type DragEndEvent,
    type DragMoveEvent,
    useDroppable,
    type CollisionDetection,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    rectSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable";
import { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { ShortcutDialog } from "@/launcher/ui/dialogs/ShortcutDialog";
import AppSurface from "@/platform/ui/surface/AppSurface";
import { OVERLAY_LAYER_Z_INDEX } from "@/shared/constants/layerZIndex";

// Helper to check if item is folder
function isFolder(item: GridItemType): item is FolderItem {
    return item.kind === 'folder';
}

interface FolderPreviewProps {
    folder: GridItemType;
    onClose: () => void;
    onClickTag?: (item: GridItemType) => void;
    onDeletePrompt: (item: GridItemType) => void;
}

// 占位符类型定义
interface PlaceholderItem {
    id: string;
    isPlaceholder: true;
}

// 类型守卫
function isPlaceholder(item: GridItemType | PlaceholderItem): item is PlaceholderItem {
    return "isPlaceholder" in item && item.isPlaceholder === true;
}

// 空白占位符组件
function EmptySlot({ id }: { id: string }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({
        id,
        disabled: false,
    });

    const style = {
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="flex flex-col items-center gap-1.5"
        >
            <div className="w-14 h-14" />
            <span className="text-xs opacity-0 select-none">-</span>
        </div>
    );
}

export function FolderPreview({ folder, onClose, onClickTag }: FolderPreviewProps) {
    const { items, setItems } = useItemStore();
    const [activeTag, setActiveTag] = useState<GridItemType | null>(null);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [titleDraft, setTitleDraft] = useState(folder.title);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<WebTagItem | null>(null);

    const containerRef = useRef<HTMLDivElement>(null);
    const initialPointerPosition = useRef<{ x: number; y: number } | null>(null);
    const lastPointerPosition = useRef<{ x: number; y: number } | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const { setNodeRef: setDroppableRef } = useDroppable({
        id: 'folder-container',
    });

    const setRefs = (element: HTMLDivElement | null) => {
        containerRef.current = element;
        setDroppableRef(element);
    };

    const currentFolder = items.find(t => t.id === folder.id);
    const currentTitle = currentFolder?.title ?? folder.title;

    const children = useMemo<GridItemType[]>(
        () => (currentFolder && isFolder(currentFolder) ? currentFolder.children : []),
        [currentFolder]
    );

    const displayItems = useMemo(() => {
        const COLS = 3;
        const MIN_ROWS = 3;
        const minSlots = COLS * MIN_ROWS;

        const currentSlots = children.length;
        const neededSlots = Math.max(minSlots, Math.ceil(currentSlots / COLS) * COLS);

        const placeholderCount = neededSlots - currentSlots;
        const placeholders: PlaceholderItem[] = Array.from(
            { length: placeholderCount },
            (_, i) => ({ id: `placeholder-${i}`, isPlaceholder: true })
        );

        return [...children, ...placeholders];
    }, [children]);

    const customCollisionDetection: CollisionDetection = (args) => {
        const pointerCollisions = pointerWithin(args);
        if (pointerCollisions.length > 0) {
            return pointerCollisions;
        }

        if (containerRef.current && (args.pointerCoordinates || lastPointerPosition.current)) {
            const rect = containerRef.current.getBoundingClientRect();
            const pointer = args.pointerCoordinates || lastPointerPosition.current;

            if (!pointer) return [];

            const { x, y } = pointer;
            const buffer = 80;

            if (
                x >= rect.left - buffer &&
                x <= rect.right + buffer &&
                y >= rect.top - buffer &&
                y <= rect.bottom + buffer
            ) {
                return [{ id: 'folder-container' }];
            }
        }
        return [];
    };

    const updateFolder = (updatedChildren: GridItemType[]) => {
        const safeChildren = updatedChildren as (WebTagItem | SystemAppItem)[];

        if (safeChildren.length <= 1) {
            const newItems = items.map(t => {
                if (t.id === folder.id) {
                    return safeChildren[0] || null;
                }
                return t;
            }).filter(Boolean) as GridItemType[];

            setItems(newItems);
            onClose();
            return;
        }

        const newItems = items.map(t =>
            t.id === folder.id
                ? { ...t, children: safeChildren } as FolderItem
                : t
        );
        setItems(newItems);
    };

    const handleDragStart = (event: DragStartEvent) => {
        const { active, activatorEvent } = event;
        const tag = children.find(t => t.id === active.id);
        if (tag) setActiveTag(tag);

        const activator = activatorEvent as (MouseEvent | TouchEvent);
        if ('clientX' in activator) {
            initialPointerPosition.current = { x: activator.clientX, y: activator.clientY };
        } else if ('touches' in activator && activator.touches.length > 0) {
            initialPointerPosition.current = { x: activator.touches[0].clientX, y: activator.touches[0].clientY };
        }

        lastPointerPosition.current = initialPointerPosition.current;
    };

    const handleDragMove = (event: DragMoveEvent) => {
        if (initialPointerPosition.current) {
            lastPointerPosition.current = {
                x: initialPointerPosition.current.x + event.delta.x,
                y: initialPointerPosition.current.y + event.delta.y,
            };
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over, delta } = event;
        setActiveTag(null);

        const currentFolder = items.find(t => t.id === folder.id);
        if (!currentFolder || !isFolder(currentFolder) || !currentFolder.children) return;

        const isOverContainer = over && over.id === 'folder-container';
        const isOverItem = over && !isPlaceholder(displayItems.find(i => i.id === over.id)!);

        let isReallyOutside = !isOverItem && !isOverContainer;

        if (isReallyOutside && containerRef.current && initialPointerPosition.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const finalX = initialPointerPosition.current.x + delta.x;
            const finalY = initialPointerPosition.current.y + delta.y;

            const buffer = 80;
            if (
                finalX >= rect.left - buffer &&
                finalX <= rect.right + buffer &&
                finalY >= rect.top - buffer &&
                finalY <= rect.bottom + buffer
            ) {
                isReallyOutside = false;
            }
        }

        if (isReallyOutside) {
            const draggedTag = currentFolder.children.find(t => t.id === active.id);
            if (draggedTag) {
                const updatedChildren = currentFolder.children.filter(t => t.id !== active.id);
                const folderIndex = items.findIndex(t => t.id === folder.id);

                if (updatedChildren.length <= 1) {
                    const newItems = [...items];
                    const itemsToInsert = [...updatedChildren, draggedTag];
                    newItems.splice(folderIndex, 1, ...itemsToInsert);
                    setItems(newItems);
                    onClose();
                } else {
                    const newItems = items.map(t =>
                        t.id === folder.id
                            ? { ...t, children: updatedChildren } as FolderItem
                            : t
                    );
                    newItems.splice(folderIndex + 1, 0, draggedTag);
                    setItems(newItems);
                }
            }
            return;
        }

        if (isOverItem && active.id !== over.id) {
            const realItems = currentFolder.children;
            const oldIndex = realItems.findIndex(t => t.id === active.id);
            const newIndex = realItems.findIndex(t => t.id === over.id);

            if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
                const updatedChildren = arrayMove(realItems as GridItemType[], oldIndex, newIndex);
                updateFolder(updatedChildren);
            }
        }

        initialPointerPosition.current = null;
        lastPointerPosition.current = null;
    };

    const handleRemoveFromFolder = (item: GridItemType) => {
        const currentFolder = items.find(t => t.id === folder.id);
        if (!currentFolder || !isFolder(currentFolder) || !currentFolder.children) return;

        const updatedChildren = currentFolder.children.filter(t => t.id !== item.id);
        const targetItem = currentFolder.children.find(t => t.id === item.id);
        if (!targetItem) return;

        const folderIndex = items.findIndex(t => t.id === folder.id);

        if (updatedChildren.length <= 1) {
            const newItems = [...items];
            const itemsToInsert = [...updatedChildren, targetItem];
            newItems.splice(folderIndex, 1, ...itemsToInsert);
            setItems(newItems);
            onClose();
        } else {
            const newItems = items.map(t =>
                t.id === folder.id
                    ? { ...t, children: updatedChildren } as FolderItem
                    : t
            );
            newItems.splice(folderIndex + 1, 0, targetItem);
            setItems(newItems);
        }
    };

    const handleEditItem = (item: GridItemType) => {
        if (item.kind !== "tag") return;
        setEditingItem(item);
        setIsEditDialogOpen(true);
    };

    useEffect(() => {
        if (!currentFolder) {
            onClose();
        }
    }, [currentFolder, onClose]);

    const saveTitle = () => {
        setItems(items.map(t => t.id === folder.id ? { ...t, title: titleDraft } as GridItemType : t));
        setIsEditingTitle(false);
    };

    useEffect(() => {
        setTitleDraft(currentTitle);
    }, [currentTitle]);

    const handleClose = (e: React.MouseEvent) => {
        e.stopPropagation();
        onClose();
    };

    const previewLayer = (
        <div className="fixed inset-0" style={{ zIndex: OVERLAY_LAYER_Z_INDEX.backdrop }}>
            <div
                style={{ zIndex: 0 }}
                className="absolute inset-0 bg-black/24 backdrop-blur-[2px] pointer-events-auto"
                onClick={handleClose}
            />

            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ zIndex: 10 }}>
                <div
                    className="pointer-events-auto pb-8 text-center text-2xl font-medium tracking-wide text-white drop-shadow-md"
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsEditingTitle(true);
                    }}
                >
                    {isEditingTitle ? (
                        <input
                            autoFocus
                            value={titleDraft}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => setTitleDraft(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") saveTitle();
                                if (e.key === "Escape") {
                                    setTitleDraft(currentTitle);
                                    setIsEditingTitle(false);
                                }
                            }}
                            onBlur={saveTitle}
                            className="bg-zinc-800/80 text-white px-3 py-1 rounded-lg border border-white/20 outline-none backdrop-blur-md shadow-xl"
                        />
                    ) : (
                        <span className="cursor-text select-text">{currentTitle}</span>
                    )}
                </div>

                <div
                    ref={setRefs}
                    className="pointer-events-auto relative h-[340px] w-[340px]"
                    onClick={(e) => e.stopPropagation()}
                >
                    <AppSurface variant="folder-preview" className="h-full w-full p-0">
                        <section className="relative z-10 h-full w-full p-6">
                            <div className="h-full w-full overflow-y-auto overflow-x-hidden">
                                <div className="relative grid grid-cols-3 justify-items-center gap-x-6 gap-y-6 content-start">
                                    <SortableContext
                                        items={displayItems.map(item => item.id)}
                                        strategy={rectSortingStrategy}
                                    >
                                        {displayItems.map((item) =>
                                            isPlaceholder(item) ? (
                                                <EmptySlot key={item.id} id={item.id} />
                                            ) : (
                                                <div key={item.id} className="overflow-visible">
                                                    <GridItem
                                                        item={item as GridItemType}
                                                        onEdit={handleEditItem}
                                                        onDeletePrompt={handleRemoveFromFolder}
                                                        onClick={onClickTag}
                                                    />
                                                </div>
                                            )
                                        )}
                                    </SortableContext>
                                </div>
                            </div>
                        </section>
                    </AppSurface>
                </div>
            </div>
        </div>
    );

    const dragOverlayLayer = (
        <DragOverlay zIndex={OVERLAY_LAYER_Z_INDEX.drag}>
            {activeTag ? (
                <GridItem
                    item={activeTag}
                    onEdit={() => { }}
                    onDeletePrompt={() => { }}
                    onClick={() => { }}
                    isOverlay
                />
            ) : null}
        </DragOverlay>
    );

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={customCollisionDetection}
            onDragStart={handleDragStart}
            onDragMove={handleDragMove}
            onDragEnd={handleDragEnd}
        >
            {typeof document !== "undefined" ? createPortal(previewLayer, document.body) : previewLayer}
            {typeof document !== "undefined" ? createPortal(dragOverlayLayer, document.body) : dragOverlayLayer}

            <ShortcutDialog
                open={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
                editTag={editingItem}
            />
        </DndContext>
    );
}



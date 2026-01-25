import { useItemStore } from "@/features/launcher/store/item";
import { type GridItem as GridItemType, type FolderItem, type WebTagItem, type SystemAppItem } from "@/store/core/itemTypes";
import { GridItem } from "../item/GridItem";
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
import { useState, useEffect, useMemo, useRef, useLayoutEffect } from "react";
import { cn } from "@/core/utils";
import { ShortcutDialog } from "../tag/ShortcutDialog";

// Global tracker for the last mouse down position (same as in Modal.tsx)
let lastClickPos = {
    x: typeof window !== "undefined" ? window.innerWidth / 2 : 0,
    y: typeof window !== "undefined" ? window.innerHeight / 2 : 0
};

if (typeof window !== "undefined") {
    window.addEventListener("mousedown", (e) => {
        lastClickPos = { x: e.clientX, y: e.clientY };
    }, { capture: true, passive: true });
}

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
    return 'isPlaceholder' in item && (item as any).isPlaceholder === true;
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
    const [entered, setEntered] = useState(false);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [titleDraft, setTitleDraft] = useState(folder.title);
    const [transformOrigin, setTransformOrigin] = useState<string>("center");
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<GridItemType | null>(null);

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

    // Calculate Transform Origin derived from mouse click position
    // Use useLayoutEffect to ensure it's calculated before the first mount update
    useLayoutEffect(() => {
        const innerWidth = window.innerWidth;
        const innerHeight = window.innerHeight;

        const containerW = 340;
        const containerH = 340;

        // Accurate viewport-to-container coordinate mapping
        const modalX = (innerWidth - containerW) / 2;
        const totalHeight = 40 /* title approx */ + 32 /* pb-8 */ + containerH;
        const startY = (innerHeight - totalHeight) / 2 + 32 + 40;

        const originX = ((lastClickPos.x - modalX) / containerW) * 100;
        const originY = ((lastClickPos.y - startY) / containerH) * 100;

        setTransformOrigin(`${originX}% ${originY}%`);

        // Force a paint frame before triggering the transition
        const timer = requestAnimationFrame(() => {
            const nextTimer = requestAnimationFrame(() => {
                setEntered(true);
            });
            return () => cancelAnimationFrame(nextTimer);
        });
        return () => cancelAnimationFrame(timer);
    }, []);

    const currentFolder = items.find(t => t.id === folder.id);
    const currentTitle = currentFolder?.title ?? folder.title;

    // Safely access children
    const realChildren = (currentFolder && isFolder(currentFolder)) ? currentFolder.children : [];
    const children: GridItemType[] = (realChildren || []) as GridItemType[];

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
        if (item.kind === 'app' || item.kind === 'folder') return;
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
        setEntered(false);
        setTimeout(onClose, 300); // Consistent with transition-duration
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={customCollisionDetection}
            onDragStart={handleDragStart}
            onDragMove={handleDragMove}
            onDragEnd={handleDragEnd}
        >
            <div
                className={cn(
                    "fixed inset-0 z-50 flex flex-col items-center justify-center transition-all duration-300",
                    entered ? "opacity-100 backdrop-blur-md bg-black/5 dark:bg-black/10" : "opacity-0 backdrop-blur-0 bg-transparent pointer-events-none"
                )}
                onClick={handleClose}
            >
                {/* Title Animation Wrapper */}
                <div
                    className={cn(
                        "text-2xl font-medium text-white drop-shadow-md tracking-wide text-center pb-8 transition-all duration-300 ease-out",
                        entered ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
                    )}
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

                {/* Main Content Animation Wrapper */}
                <div
                    ref={setRefs}
                    style={{ transformOrigin } as React.CSSProperties}
                    className={cn(
                        "relative overflow-hidden rounded-[32px] transition-all duration-300 ease-in-out p-6 w-[340px] h-[340px] shadow-2xl",
                        entered ? "opacity-100 scale-100" : "opacity-0 scale-50"
                    )}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Mixed Background Layers - Base White/Black + Primary Tint */}
                    <div className="absolute inset-0 bg-white/30 dark:bg-black/50 backdrop-blur-3xl border border-white/20 dark:border-white/10 -z-20" />
                    <div className="absolute inset-0 bg-primary/10 dark:bg-primary/20 pointer-events-none -z-10" />

                    <div className="relative z-10 grid grid-cols-3 justify-items-center gap-x-2 gap-y-4 h-full overflow-y-auto overflow-x-hidden content-start [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pt-3 pb-4 px-1">
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
            </div>

            <DragOverlay>
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

            <ShortcutDialog
                open={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
                editTag={editingItem as any}
            />
        </DndContext>
    );
}

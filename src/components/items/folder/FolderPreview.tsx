import { useTagStore } from "@/store/modules/tag";
import { type Tag } from "@/store/core/types";
import { TagItem } from "@/components/items/tag/TagItem";
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
import { cn } from "@/lib/utils";

interface FolderPreviewProps {
    folder: Tag;
    onClose: () => void;
    onClickTag?: (tag: Tag) => void;
    onDeletePrompt: (tag: Tag) => void; // 设为必选
}

// 占位符类型定义
interface PlaceholderItem {
    id: string;
    isPlaceholder: true;
}

// 类型守卫
function isPlaceholder(item: Tag | PlaceholderItem): item is PlaceholderItem {
    return 'isPlaceholder' in item && item.isPlaceholder === true;
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

export function FolderPreview({ folder, onClose, onClickTag, onDeletePrompt }: FolderPreviewProps) {
    const { tags, setTags } = useTagStore();
    const [activeTag, setActiveTag] = useState<Tag | null>(null);
    const [entered, setEntered] = useState(false);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [titleDraft, setTitleDraft] = useState(folder.title);

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

    const currentFolder = tags.find(t => t.id === folder.id);
    const currentTitle = currentFolder?.title ?? folder.title;
    const children = currentFolder?.children || [];

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

    const updateFolder = (updatedChildren: Tag[]) => {
        if (updatedChildren.length <= 1) {
            const newTags = tags.map(t => {
                if (t.id === folder.id) {
                    return updatedChildren[0] || null;
                }
                return t;
            }).filter(Boolean) as Tag[];

            setTags(newTags);
            onClose();
            return;
        }

        const newTags = tags.map(t =>
            t.id === folder.id
                ? { ...t, children: updatedChildren }
                : t
        );
        setTags(newTags);
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

        const currentFolder = tags.find(t => t.id === folder.id);
        if (!currentFolder?.children) return;

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
                const folderIndex = tags.findIndex(t => t.id === folder.id);

                if (updatedChildren.length <= 1) {
                    const newTags = [...tags];
                    const itemsToInsert = [...updatedChildren, draggedTag];
                    newTags.splice(folderIndex, 1, ...itemsToInsert);
                    setTags(newTags);
                    onClose();
                } else {
                    const newTags = tags.map(t =>
                        t.id === folder.id
                            ? { ...t, children: updatedChildren }
                            : t
                    );
                    newTags.splice(folderIndex + 1, 0, draggedTag);
                    setTags(newTags);
                }
            }
            return;
        }

        if (isOverItem && active.id !== over.id) {
            const realItems = currentFolder.children;
            const oldIndex = realItems.findIndex(t => t.id === active.id);
            const newIndex = realItems.findIndex(t => t.id === over.id);

            if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
                const updatedChildren = arrayMove(realItems, oldIndex, newIndex);
                updateFolder(updatedChildren);
            }
        }

        initialPointerPosition.current = null;
        lastPointerPosition.current = null;
    };

    const handleRemoveFromFolder = (tag: Tag) => {
        const currentFolder = tags.find(t => t.id === folder.id);
        if (!currentFolder?.children) return;

        const updatedChildren = currentFolder.children.filter(t => t.id !== tag.id);
        const folderIndex = tags.findIndex(t => t.id === folder.id);

        if (updatedChildren.length <= 1) {
            const newTags = [...tags];
            const itemsToInsert = [...updatedChildren, tag];
            newTags.splice(folderIndex, 1, ...itemsToInsert);
            setTags(newTags);
            onClose();
        } else {
            const newTags = tags.map(t =>
                t.id === folder.id
                    ? { ...t, children: updatedChildren }
                    : t
            );
            newTags.splice(folderIndex + 1, 0, tag);
            setTags(newTags);
        }
    };

    useEffect(() => {
        // 如果当前文件夹在 tags 中找不到了，说明它被解散了，自动关闭预览
        if (!currentFolder) {
            onClose();
        }
    }, [currentFolder, onClose]);

    useEffect(() => {
        setEntered(true);
    }, []);

    const saveTitle = () => {
        setTags(tags.map(t => t.id === folder.id ? { ...t, title: titleDraft } : t));
        setIsEditingTitle(false);
    };

    useEffect(() => {
        setTitleDraft(currentTitle);
    }, [currentTitle]);

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
                    "fixed inset-0 z-50 flex flex-col items-center justify-center bg-transparent backdrop-blur-md transition-opacity duration-300",
                    entered ? "opacity-100" : "opacity-0"
                )}
                onClick={onClose}
            >
                <div
                    className="text-2xl font-medium text-white drop-shadow-md tracking-wide text-center pb-8"
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
                            className="bg-white/10 text-white px-3 py-1 rounded-lg border border-white/30 outline-none"
                        />
                    ) : (
                        <span className="cursor-text select-text">{currentTitle}</span>
                    )}
                </div>

                <div
                    ref={setRefs}
                    className={cn(
                        "bg-white/40 backdrop-blur-3xl rounded-[32px] shadow-2xl border border-white/30 p-6 w-[340px] h-[340px] transition-all duration-300 ease-out",
                        entered ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-90 translate-y-4"
                    )}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="grid grid-cols-3 gap-x-2 gap-y-4 h-full overflow-y-auto content-start [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden p-1">
                        <SortableContext
                            items={displayItems.map(item => item.id)}
                            strategy={rectSortingStrategy}
                        >
                            {displayItems.map((item) =>
                                isPlaceholder(item) ? (
                                    <EmptySlot key={item.id} id={item.id} />
                                ) : (
                                    <TagItem
                                        key={item.id}
                                        tag={item}
                                        onEdit={handleRemoveFromFolder}
                                        onDeletePrompt={onDeletePrompt}
                                        onClick={onClickTag}
                                    />
                                )
                            )}
                        </SortableContext>
                    </div>
                </div>
            </div>

            <DragOverlay>
                {activeTag ? (
                    <TagItem
                        tag={activeTag}
                        onEdit={() => { }}
                        onDeletePrompt={() => { }}
                        onClick={() => { }}
                        isOverlay
                    />
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}

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

// 空白占位符组件 - 完全不可见但占据空间
function EmptySlot({ id }: { id: string }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({
        id,
        disabled: false, // 必须启用才能接收 drop
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
            {/* 占位符 - 完全透明但占据空间 */}
            <div className="w-14 h-14" />
            {/* 占位文本空间 */}
            <span className="text-xs opacity-0 select-none">-</span>
        </div>
    );
}

export function FolderPreview({ folder, onClose }: FolderPreviewProps) {
    const { tags, setTags } = useTagStore();
    const [activeTag, setActiveTag] = useState<Tag | null>(null);
    const [entered, setEntered] = useState(false);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [titleDraft, setTitleDraft] = useState(folder.title);

    // 容器 ref，用于自定义碰撞检测
    const containerRef = useRef<HTMLDivElement>(null);
    // 记录初始鼠标位置，用于通过 delta 计算实时位置
    const initialPointerPosition = useRef<{ x: number; y: number } | null>(null);
    // 记录拖拽中的鼠标位置，作为 onDragEnd 判定失败时的兜底
    const lastPointerPosition = useRef<{ x: number; y: number } | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    // 将整个文件夹内容区域作为一个可放置区域
    const { setNodeRef: setDroppableRef } = useDroppable({
        id: 'folder-container',
    });

    // 合并 refs
    const setRefs = (element: HTMLDivElement | null) => {
        containerRef.current = element;
        setDroppableRef(element);
    };

    // 从最新的 tags 中获取文件夹数据
    const currentFolder = tags.find(t => t.id === folder.id);
    const currentTitle = currentFolder?.title ?? folder.title;
    const children = currentFolder?.children || [];

    // 动态生成占位符，填满至少 3 行（9 个格子）
    const displayItems = useMemo(() => {
        const COLS = 3;
        const MIN_ROWS = 3;
        const minSlots = COLS * MIN_ROWS;

        // 计算需要的总槽位数：至少 minSlots，且确保填满当前行
        const currentSlots = children.length;
        const neededSlots = Math.max(minSlots, Math.ceil(currentSlots / COLS) * COLS);

        // 生成占位符
        const placeholderCount = neededSlots - currentSlots;
        const placeholders: PlaceholderItem[] = Array.from(
            { length: placeholderCount },
            (_, i) => ({ id: `placeholder-${i}`, isPlaceholder: true })
        );

        return [...children, ...placeholders];
    }, [children]);

    // 自定义碰撞检测：优先使用 pointerWithin，但对 folder-container 做特殊处理
    const customCollisionDetection: CollisionDetection = (args) => {
        // 首先尝试标准的碰撞检测
        const pointerCollisions = pointerWithin(args);

        // 如果有碰撞结果，直接返回
        if (pointerCollisions.length > 0) {
            return pointerCollisions;
        }

        // 如果没有碰撞，检查鼠标是否在容器的物理边界内（带缓冲区）
        if (containerRef.current && (args.pointerCoordinates || lastPointerPosition.current)) {
            const rect = containerRef.current.getBoundingClientRect();
            // 在自定义检测中，args.pointerCoordinates 是可用的
            const pointer = args.pointerCoordinates || lastPointerPosition.current;

            if (!pointer) return [];

            const { x, y } = pointer;

            // 缓冲区：允许超出容器边界 80px 也不会移出
            const buffer = 80;

            // 如果鼠标在容器范围内（含缓冲区），返回 folder-container 作为碰撞目标
            if (
                x >= rect.left - buffer &&
                x <= rect.right + buffer &&
                y >= rect.top - buffer &&
                y <= rect.bottom + buffer
            ) {
                return [{ id: 'folder-container' }];
            }
        }

        // 否则返回空数组（表示在容器外）
        return [];
    };

    const updateFolder = (updatedChildren: Tag[]) => {
        // 如果只剩1个或0个子项,解散文件夹
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

        // 更新文件夹
        const newTags = tags.map(t =>
            t.id === folder.id
                ? { ...folder, children: updatedChildren }
                : t
        );
        setTags(newTags);
    };

    const handleDragStart = (event: DragStartEvent) => {
        const { active, activatorEvent } = event;
        const tag = children.find(t => t.id === active.id);
        if (tag) setActiveTag(tag);

        // 从触发事件中获取初始坐标
        const activator = activatorEvent as (MouseEvent | TouchEvent);
        if ('clientX' in activator) {
            initialPointerPosition.current = { x: activator.clientX, y: activator.clientY };
        } else if ('touches' in activator && activator.touches.length > 0) {
            initialPointerPosition.current = { x: activator.touches[0].clientX, y: activator.touches[0].clientY };
        }

        lastPointerPosition.current = initialPointerPosition.current;
    };

    const handleDragMove = (event: DragMoveEvent) => {
        // 通过 初始位置 + delta 位移 计算实时物理坐标
        // 解决 DragMoveEvent 类型定义中不存在 pointerCoordinates 的问题
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

        // 获取最新的文件夹数据
        const currentFolder = tags.find(t => t.id === folder.id);
        if (!currentFolder?.children) return;

        const isOverContainer = over && over.id === 'folder-container';
        const isOverItem = over && over.id !== 'folder-container';

        // 判定逻辑核心：使用最终位移计算坐标进行二次物理边界检查
        let isReallyOutside = !isOverItem && !isOverContainer;

        if (isReallyOutside && containerRef.current && initialPointerPosition.current) {
            const rect = containerRef.current.getBoundingClientRect();
            // 计算松手瞬间的物理坐标
            const finalX = initialPointerPosition.current.x + delta.x;
            const finalY = initialPointerPosition.current.y + delta.y;

            const buffer = 80; // 快速移动时使用更大的缓冲区
            if (
                finalX >= rect.left - buffer &&
                finalX <= rect.right + buffer &&
                finalY >= rect.top - buffer &&
                finalY <= rect.bottom + buffer
            ) {
                isReallyOutside = false;
            }
        }

        // 如果确认拖到容器外，移除该项
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

        // 文件夹内排序（包括拖到占位符上）
        if (isOverItem && active.id !== over.id) {
            // 过滤掉占位符，只处理真实 items
            const realItems = currentFolder.children;
            const oldIndex = realItems.findIndex(t => t.id === active.id);

            // 如果 over 是占位符，计算其在 displayItems 中的位置
            let newIndex: number;
            if (over.id.toString().startsWith('placeholder-')) {
                // 找到这个占位符在 displayItems 中的索引
                const overIndexInDisplay = displayItems.findIndex(item =>
                    isPlaceholder(item) ? item.id === over.id : item.id === over.id
                );
                // 将其映射到真实 items 的末尾
                newIndex = Math.min(overIndexInDisplay, realItems.length - 1);
            } else {
                newIndex = realItems.findIndex(t => t.id === over.id);
            }

            if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
                const updatedChildren = arrayMove(realItems, oldIndex, newIndex);
                updateFolder(updatedChildren);
            }
        }

        // 重置记录
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
                    "fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/40 backdrop-blur-md transition-opacity duration-300",
                    entered ? "opacity-100" : "opacity-0"
                )}
                onClick={onClose}
            >
                {/* Folder Title */}
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
                                    setTitleDraft(folder.title);
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
                    {/* Content Grid */}
                    <div className="grid grid-cols-3 gap-x-2 gap-y-4 h-full overflow-y-auto content-start [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden p-1">
                        <SortableContext
                            items={displayItems.map(item => isPlaceholder(item) ? item.id : item.id)}
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
                                        onClick={() => { }}
                                    />
                                )
                            )}
                        </SortableContext>
                    </div>
                </div>
            </div>

            {/* DragOverlay */}
            <DragOverlay>
                {activeTag ? (
                    <TagItem
                        tag={activeTag}
                        onEdit={() => { }}
                        onClick={() => { }}
                        isOverlay
                    />
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}

import { useTagStore } from "@/store/modules/tag";
import { type Tag } from "@/store/core/types";
import { TagItem } from "@/components/items/tag/TagItem";
import {
    DndContext,
    rectIntersection,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    type DragStartEvent,
    type DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    rectSortingStrategy,
} from "@dnd-kit/sortable";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface FolderPreviewProps {
    folder: Tag;
    onClose: () => void;
}

export function FolderPreview({ folder, onClose }: FolderPreviewProps) {
    const { tags, setTags } = useTagStore();
    const [activeTag, setActiveTag] = useState<Tag | null>(null);
    const [entered, setEntered] = useState(false);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [titleDraft, setTitleDraft] = useState(folder.title);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const updateFolder = (updatedChildren: Tag[]) => {
        // 如果只剩1个或0个子项,解散文件夹
        if (updatedChildren.length <= 1) {
            const newTags = tags.map(t => {
                if (t.id === folder.id) {
                    // 返回剩余的子项(如果有)
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
        const { active } = event;
        const tag = folder.children?.find(t => t.id === active.id);
        if (tag) setActiveTag(tag);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveTag(null);

        // 获取最新的文件夹数据
        const currentFolder = tags.find(t => t.id === folder.id);
        if (!currentFolder?.children) return;

        // 检查是否拖出了预览区域
        if (!over) {
            // 从文件夹中移除该标签,添加到主列表
            const draggedTag = currentFolder.children.find(t => t.id === active.id);
            if (draggedTag) {
                const updatedChildren = currentFolder.children.filter(t => t.id !== active.id);
                const folderIndex = tags.findIndex(t => t.id === folder.id);

                // 情况1: 文件夹剩余项 <= 1，需要解散文件夹
                if (updatedChildren.length <= 1) {
                    const newTags = [...tags];
                    // 移除原文件夹，插入剩余的子项(如果有)和拖出的项
                    const itemsToInsert = [...updatedChildren, draggedTag];
                    newTags.splice(folderIndex, 1, ...itemsToInsert);

                    setTags(newTags);
                    onClose(); // 关闭预览
                }
                // 情况2: 文件夹保留，移除该项并将其添加到文件夹后面
                else {
                    const newTags = tags.map(t =>
                        t.id === folder.id
                            ? { ...t, children: updatedChildren }
                            : t
                    );
                    // 在文件夹后面插入拖出的项
                    newTags.splice(folderIndex + 1, 0, draggedTag);
                    setTags(newTags);
                }
            }
            return;
        }

        // 文件夹内排序
        if (active.id !== over.id) {
            const oldIndex = currentFolder.children.findIndex(t => t.id === active.id);
            const newIndex = currentFolder.children.findIndex(t => t.id === over.id);

            if (oldIndex !== -1 && newIndex !== -1) {
                const updatedChildren = arrayMove(currentFolder.children, oldIndex, newIndex);
                updateFolder(updatedChildren);
            }
        }
    };

    const handleRemoveFromFolder = (tag: Tag) => {
        // 获取最新的文件夹数据
        const currentFolder = tags.find(t => t.id === folder.id);
        if (!currentFolder?.children) return;

        const updatedChildren = currentFolder.children.filter(t => t.id !== tag.id);
        const folderIndex = tags.findIndex(t => t.id === folder.id);

        // 情况1: 文件夹剩余项 <= 1，需要解散文件夹
        if (updatedChildren.length <= 1) {
            const newTags = [...tags];
            const itemsToInsert = [...updatedChildren, tag];
            newTags.splice(folderIndex, 1, ...itemsToInsert);

            setTags(newTags);
            onClose();
        }
        // 情况2: 文件夹保留
        else {
            const newTags = tags.map(t =>
                t.id === folder.id
                    ? { ...t, children: updatedChildren }
                    : t
            );
            newTags.splice(folderIndex + 1, 0, tag);
            setTags(newTags);
        }
    };

    // 从最新的 tags 中获取文件夹数据
    const currentFolder = tags.find(t => t.id === folder.id);
    const currentTitle = currentFolder?.title ?? folder.title;
    const children = currentFolder?.children || [];

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
            collisionDetection={rectIntersection}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div
                className={cn(
                    "fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/30 backdrop-blur-md gap-6 transition-opacity duration-200",
                    entered ? "opacity-100" : "opacity-0"
                )}
                onClick={onClose}
            >
                {/* Folder Title outside panel */}
                <div
                    className="text-2xl font-medium text-white drop-shadow-md tracking-wide text-center"
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
                    className={cn(
                        "bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-5 w-[320px] h-[320px] transition-all duration-200",
                        entered ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-1"
                    )}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Content */}
                    <div className="grid grid-cols-3 gap-x-1 gap-y-4 h-full overflow-y-auto content-start [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                        <SortableContext
                            items={children.map(t => t.id)}
                            strategy={rectSortingStrategy}
                        >
                            {children.map((tag) => (
                                <TagItem
                                    key={tag.id}
                                    tag={tag}
                                    onEdit={handleRemoveFromFolder}
                                    onClick={() => { }}
                                />
                            ))}
                        </SortableContext>
                    </div>
                </div>
            </div>

            {/* DragOverlay outside modal */}
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

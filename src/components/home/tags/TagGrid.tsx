import { useState, useRef, useCallback } from "react";
import { useAppStore, type Tag } from "@/lib/store";
import { TagItem } from "./TagItem";
import { FolderItem } from "./FolderItem";
import { AddTagDialog } from "../add/AddTagDialog";
import { ThemeDialog } from "../theme/ThemeDialog";
import { SettingsDialog } from "../settings/SettingsDialog";
import { IconManagerDialog } from "../tools/IconManagerDialog";
import { FolderPreview } from "../folder/FolderPreview";
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

const HOVER_DELAY = 1000; // 悬停1000ms后判定为创建文件夹

export function TagGrid() {
    const { tags, setTags } = useAppStore();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isThemeDialogOpen, setIsThemeDialogOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isIconManagerOpen, setIsIconManagerOpen] = useState(false);
    const [editingTag, setEditingTag] = useState<Tag | null>(null);
    const [activeTag, setActiveTag] = useState<Tag | null>(null);
    const [hoverTarget, setHoverTarget] = useState<string | null>(null);
    const [openFolder, setOpenFolder] = useState<Tag | null>(null);

    const hoverTimerRef = useRef<number | null>(null);
    const lastOverIdRef = useRef<string | null>(null);

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

        if (!tag || !folder || !folder.isFolder || tag.isSystem) return;

        // 如果拖拽的也是文件夹,不允许嵌套
        if (tag.isFolder) return;

        // 将标签添加到文件夹
        const updatedFolder: Tag = {
            ...folder,
            children: [...(folder.children || []), tag],
        };

        // 移除原标签,更新文件夹
        const newTags = tags.map(t =>
            t.id === folderId ? updatedFolder : t
        ).filter(t => t.id !== tagId);

        setTags(newTags);
    }, [tags, setTags]);

    const createFolder = useCallback((tag1Id: string, tag2Id: string) => {
        const tag1 = tags.find(t => t.id === tag1Id);
        const tag2 = tags.find(t => t.id === tag2Id);

        if (!tag1 || !tag2 || tag1.isSystem || tag2.isSystem) return;

        // 如果 tag2 是文件夹,将 tag1 添加到文件夹中
        if (tag2.isFolder) {
            addToFolder(tag1Id, tag2Id);
            return;
        }

        // 如果 tag1 是文件夹,将 tag2 添加到文件夹中
        if (tag1.isFolder) {
            addToFolder(tag2Id, tag1Id);
            return;
        }

        // 两个都是普通标签,创建新文件夹
        const folderId = `folder_${Date.now()}`;
        const newFolder: Tag = {
            id: folderId,
            title: 'New Folder',
            url: '#',
            isFolder: true,
            type: 'folder',
            children: [tag1, tag2],
        };

        // 移除原标签,添加文件夹
        const newTags = tags.filter(t => t.id !== tag1Id && t.id !== tag2Id);
        const tag2Index = tags.findIndex(t => t.id === tag2Id);
        newTags.splice(tag2Index, 0, newFolder);

        setTags(newTags);
    }, [tags, setTags, addToFolder]);

    const handleTagClick = (tag: Tag) => {
        // 文件夹点击打开预览
        if (tag.isFolder) {
            setOpenFolder(tag);
            return;
        }

        // 系统图标的特殊处理
        if (tag.isSystem) {
            switch (tag.type) {
                case 'settings':
                    setIsSettingsOpen(true);
                    break;
                case 'theme':
                    setIsThemeDialogOpen(true);
                    break;
                case 'add':
                    setEditingTag(null);
                    setIsDialogOpen(true);
                    break;
                case 'icon-manager':
                    setIsIconManagerOpen(true);
                    break;
            }
        }
    };

    const handleEditClick = (tag: Tag) => {
        // 系统图标和文件夹不允许编辑
        if (tag.isSystem || tag.isFolder) return;
        setEditingTag(tag);
        setIsDialogOpen(true);
    };

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const tag = tags.find(t => t.id === active.id);
        if (tag) setActiveTag(tag);

        // 清除任何现有的定时器
        if (hoverTimerRef.current) {
            clearTimeout(hoverTimerRef.current);
            hoverTimerRef.current = null;
        }
        lastOverIdRef.current = null;
        setHoverTarget(null);
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;

        if (!over || active.id === over.id) {
            // 清除悬停状态
            if (hoverTimerRef.current) {
                clearTimeout(hoverTimerRef.current);
                hoverTimerRef.current = null;
            }
            lastOverIdRef.current = null;
            setHoverTarget(null);
            return;
        }

        const activeTag = tags.find(t => t.id === active.id);
        const overTag = tags.find(t => t.id === over.id);

        // 系统图标不参与文件夹创建,直接返回
        if (activeTag?.isSystem || overTag?.isSystem) {
            if (hoverTimerRef.current) {
                clearTimeout(hoverTimerRef.current);
                hoverTimerRef.current = null;
            }
            lastOverIdRef.current = null;
            setHoverTarget(null);
            return;
        }

        // 检查是否持续悬停在同一个目标上
        if (lastOverIdRef.current === over.id) {
            // 持续悬停在同一目标,不执行任何操作,等待创建文件夹
            return;
        }

        // 目标改变了
        if (hoverTimerRef.current) {
            clearTimeout(hoverTimerRef.current);
        }

        lastOverIdRef.current = over.id as string;
        setHoverTarget(null);

        // 设置新的定时器
        hoverTimerRef.current = setTimeout(() => {
            // 悬停时间足够,标记为准备创建文件夹
            setHoverTarget(over.id as string);
        }, HOVER_DELAY) as unknown as number;
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        // 清除定时器
        if (hoverTimerRef.current) {
            clearTimeout(hoverTimerRef.current);
            hoverTimerRef.current = null;
        }

        if (over && active.id !== over.id) {
            const activeTag = tags.find(t => t.id === active.id);
            const overTag = tags.find(t => t.id === over.id);

            // 检查是否应该创建文件夹
            // 必须满足: hoverTarget 已设置 且 最终松手位置就是 hoverTarget
            const shouldCreateFolder =
                hoverTarget === over.id &&
                lastOverIdRef.current === over.id &&
                activeTag &&
                overTag &&
                !activeTag.isSystem &&
                !overTag.isSystem;

            if (shouldCreateFolder) {
                // 创建文件夹或添加到文件夹
                createFolder(active.id as string, over.id as string);
            } else {
                // 普通排序
                const oldIndex = tags.findIndex((t) => t.id === active.id);
                const newIndex = tags.findIndex((t) => t.id === over.id);

                if (oldIndex !== -1 && newIndex !== -1) {
                    setTags(arrayMove(tags, oldIndex, newIndex));
                }
            }
        }

        // 清除所有状态
        setActiveTag(null);
        setHoverTarget(null);
        lastOverIdRef.current = null;
    };

    const handleDragCancel = () => {
        if (hoverTimerRef.current) {
            clearTimeout(hoverTimerRef.current);
            hoverTimerRef.current = null;
        }
        setActiveTag(null);
        setHoverTarget(null);
        lastOverIdRef.current = null;
    };

    return (
        <div className="w-full h-full py-8 px-4 overflow-y-auto [scrollbar-gutter:stable]">
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
                onDragCancel={handleDragCancel}
            >
                <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-9 lg:grid-cols-10 xl:grid-cols-12 gap-4">
                    <SortableContext
                        items={tags.map(t => t.id)}
                        strategy={rectSortingStrategy}
                    >
                        {tags.map((tag) => {
                            const isHoverTarget = hoverTarget === tag.id;

                            if (tag.isFolder) {
                                return (
                                    <div key={tag.id} className="relative">
                                        <FolderItem
                                            tag={tag}
                                            onEdit={handleEditClick}
                                            onClick={handleTagClick}
                                        />
                                        {isHoverTarget && (
                                            <div className="absolute inset-0 w-14 h-14 rounded-2xl border-2 border-white/40 bg-white/5 pointer-events-none" />
                                        )}
                                    </div>
                                );
                            }

                            return (
                                <div key={tag.id} className="relative">
                                    <TagItem
                                        tag={tag}
                                        onEdit={handleEditClick}
                                        onClick={handleTagClick}
                                    />
                                    {isHoverTarget && (
                                        <div className="absolute inset-0 w-14 h-14 rounded-2xl border-2 border-white/40 bg-white/5 pointer-events-none" />
                                    )}
                                </div>
                            );
                        })}
                    </SortableContext>
                </div>

                <DragOverlay adjustScale={true}>
                    {activeTag ? (
                        activeTag.isFolder ? (
                            <FolderItem
                                tag={activeTag}
                                onEdit={() => { }}
                                onClick={() => { }}
                                isOverlay
                            />
                        ) : (
                            <TagItem
                                tag={activeTag}
                                onEdit={() => { }}
                                onClick={() => { }}
                                isOverlay
                            />
                        )
                    ) : null}
                </DragOverlay>
            </DndContext>

            <AddTagDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                editTag={editingTag}
            />
            <ThemeDialog
                open={isThemeDialogOpen}
                onOpenChange={setIsThemeDialogOpen}
            />
            <SettingsDialog
                open={isSettingsOpen}
                onOpenChange={setIsSettingsOpen}
            />
            <IconManagerDialog
                open={isIconManagerOpen}
                onOpenChange={setIsIconManagerOpen}
            />

            {openFolder && (
                <FolderPreview
                    folder={openFolder}
                    onClose={() => setOpenFolder(null)}
                />
            )}
        </div>
    );
}

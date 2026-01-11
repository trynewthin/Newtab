import { useState } from "react";
import { useAppStore, type Tag } from "@/lib/store";
import { TagItem } from "./TagItem";
import { AddTagDialog } from "../add/AddTagDialog";
import { ThemeDialog } from "../theme/ThemeDialog";
import { SettingsDialog } from "../settings/SettingsDialog";
import { IconManagerDialog } from "../tools/IconManagerDialog";
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
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
} from "@dnd-kit/sortable";

export function TagGrid() {
    const { tags, setTags } = useAppStore();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isThemeDialogOpen, setIsThemeDialogOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isIconManagerOpen, setIsIconManagerOpen] = useState(false);
    const [editingTag, setEditingTag] = useState<Tag | null>(null);
    const [activeTag, setActiveTag] = useState<Tag | null>(null);

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

    const handleTagClick = (tag: Tag) => {
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
        // 系统图标不允许编辑,只能删除
        if (tag.isSystem) return;
        setEditingTag(tag);
        setIsDialogOpen(true);
    };

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const tag = tags.find(t => t.id === active.id);
        if (tag) setActiveTag(tag);
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = tags.findIndex((t) => t.id === active.id);
            const newIndex = tags.findIndex((t) => t.id === over.id);

            if (oldIndex !== -1 && newIndex !== -1) {
                setTags(arrayMove(tags, oldIndex, newIndex));
            }
        }
    };

    const handleDragEnd = () => {
        setActiveTag(null);
    };

    const handleDragCancel = () => {
        setActiveTag(null);
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
                        {tags.map((tag) => (
                            <TagItem
                                key={tag.id}
                                tag={tag}
                                onEdit={handleEditClick}
                                onClick={handleTagClick}
                            />
                        ))}
                    </SortableContext>
                </div>

                <DragOverlay adjustScale={true}>
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
        </div>
    );
}

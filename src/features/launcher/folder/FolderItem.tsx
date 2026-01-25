import { useUIStore } from "@/features/launcher/store/ui";
import { X, Edit2 } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/core/utils";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ItemIcon } from "../base/ItemIcon";
import type { FolderItem as FolderItemType, GridItem } from "@/store/core/itemTypes";

interface FolderItemProps {
    item: FolderItemType;
    onEdit: (item: FolderItemType) => void;
    onDeletePrompt: (item: GridItem) => void;
    onClick?: (item: GridItem) => void;
    isOverlay?: boolean;
    isNearTarget?: boolean;
    isHoverTarget?: boolean;
}

export function FolderItem({ item, onEdit, onDeletePrompt, onClick, isOverlay, isNearTarget, isHoverTarget }: FolderItemProps) {
    const { isEditing, selectedTagIds } = useUIStore();
    const isSelected = selectedTagIds.includes(item.id);

    const [childIcons, setChildIcons] = useState<string[]>([]);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: item.id,
        disabled: !!isOverlay,
    });

    const style = {
        transform: (isNearTarget || isHoverTarget || !transform) ? undefined : CSS.Translate.toString(transform),
        transition: isDragging ? undefined : transition,
        opacity: isDragging ? 0 : 1,
        zIndex: isOverlay ? 100 : undefined,
    };

    // 加载子项的图标
    useEffect(() => {
        const children = item.children || [];
        const icons = children.slice(0, 4).map(child => {
            if (child.kind === 'app') return child.icon || "";
            if (child.icon && child.icon.length < 4) {
                return child.icon; // emoji
            }
            return child.icon || `https://www.google.com/s2/favicons?domain=${child.url}&sz=64`;
        });
        setChildIcons(icons);
    }, [item.id, item.children]);

    const handleDelete = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onDeletePrompt(item);
    };

    const handleEdit = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onEdit(item);
    };

    const handleClick = (e: React.MouseEvent) => {
        if (isOverlay) {
            e.preventDefault();
            return;
        }

        // Folder logic: In editing mode, folders are NOT selectable.
        // Clicking them will still open the folder preview.
        e.preventDefault();
        if (onClick) {
            onClick(item);
        }
    };

    const renderGridIcon = (index: number) => {
        if (index >= childIcons.length) {
            return null;
        }

        childIcons[index];
        const child = item.children?.[index];
        if (!child) return null;

        const isApp = child.kind === 'app';
        // 彻底去透明，确保图标轮廓与主背景有清晰隔离
        const bg = isApp ? 'rgb(255, 255, 255)' : (child.backgroundColor ?? "rgb(255, 255, 255)");
        const userScale = child.kind === 'tag' ? (child.iconSize || 1) : 1;

        // 统一缩放基准：利用 ItemIcon 内部自带的 0.85 比例，叠加 1.35x 约为满格
        const finalScale = 1.35 * userScale;

        return (
            <div className="flex items-center justify-center w-full h-full overflow-hidden">
                <ItemIcon
                    title={child.title}
                    icon={child.icon}
                    iconDataUrl={isApp ? undefined : (child.kind === 'tag' ? child.iconDataUrl : undefined)}
                    isSystem={isApp}
                    backgroundColor={bg}
                    scale={finalScale}
                    // 强制覆盖 ItemIcon 内部的 [85%] 约束，使得微型图标能够真正撑满格子空间并居中
                    className="w-full h-full rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.1)] [&>div]:w-full [&>div]:h-full"
                />
            </div>
        );
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "group relative flex flex-col items-center gap-1.5 w-14",
                isEditing && !isDragging && !isOverlay && "animate-[shake_0.5s_ease-in-out_infinite]",
                isOverlay && "scale-110 rotate-3 cursor-grabbing"
            )}
            {...(isOverlay ? {} : attributes)}
            {...(isOverlay ? {} : listeners)}
        >
            <div className={cn(
                "absolute -top-3 -right-3 flex gap-1 transition-all z-20 p-1 rounded-full bg-background/50 backdrop-blur-md border shadow-sm",
                (isEditing && !isOverlay) ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
            )}>
                <button
                    onClick={handleEdit}
                    className="p-1 bg-primary text-primary-foreground rounded-full shadow-sm hover:scale-110 transition-transform cursor-pointer"
                    title="Edit"
                >
                    <Edit2 size={10} />
                </button>
                <button
                    onClick={handleDelete}
                    className="p-1 bg-destructive text-destructive-foreground rounded-full shadow-sm hover:scale-110 transition-transform cursor-pointer"
                    title="Remove"
                >
                    <X size={10} />
                </button>
            </div>

            <ItemIcon
                onClick={handleClick}
                className={cn(
                    "relative flex items-center justify-center w-14 h-14 rounded-2xl shadow-lg hover:shadow-xl transition-shadow",
                    "bg-primary/10 dark:bg-primary/15 backdrop-blur-xl",
                    isEditing ? "cursor-pointer" : "cursor-pointer",
                    isOverlay && "cursor-grabbing shadow-2xl",
                    isSelected && "shadow-[0_0_0_2px_rgba(var(--color-primary),1),0_0_12px_rgba(var(--color-primary),0.5)]"
                )}
            >
                {/* 精调布局：增加 gap 到 4px，p-1.5 配合 w-11，确保四宫格图标间距匀称且居中 */}
                <div className="relative z-10 w-11 h-11 grid grid-cols-2 grid-rows-2 gap-[4px] p-1.5">
                    {[0, 1, 2, 3].map((index) => (
                        <div key={index} className="w-full h-full">
                            {renderGridIcon(index)}
                        </div>
                    ))}
                </div>
            </ItemIcon>

            <span className="text-xs text-center font-medium truncate w-full max-w-[80px] drop-shadow-md text-white select-none">
                {item.title}
            </span>
        </div>
    );
}

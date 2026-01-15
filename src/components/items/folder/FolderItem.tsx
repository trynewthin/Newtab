import { type Tag } from "@/store/core/types";
import { useUIStore } from "@/store/modules/ui";
import { X, Edit2, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ItemIcon } from "@/components/items/ItemIcon";

interface FolderItemProps {
    tag: Tag;
    onEdit: (tag: Tag) => void;
    onDeletePrompt: (tag: Tag) => void;
    onClick?: (tag: Tag) => void;
    isOverlay?: boolean;
    isNearTarget?: boolean;
    isHoverTarget?: boolean;
}

export function FolderItem({ tag, onEdit, onDeletePrompt, onClick, isOverlay, isNearTarget, isHoverTarget }: FolderItemProps) {
    const { isEditing, selectedTagIds, toggleTagSelection } = useUIStore();
    const isSelected = selectedTagIds.includes(tag.id);

    const [childIcons, setChildIcons] = useState<string[]>([]);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: tag.id,
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
        const children = tag.children || [];
        const icons = children.slice(0, 4).map(child => {
            if (child.isSystem) return child.icon || ""; // 返回系统图标 ID
            if (child.icon && child.icon.length < 4) {
                return child.icon; // emoji
            }
            return child.icon || `https://www.google.com/s2/favicons?domain=${child.url}&sz=64`;
        });
        setChildIcons(icons);
    }, [tag.id, tag.children]);

    const handleDelete = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onDeletePrompt(tag);
    };

    const handleEdit = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onEdit(tag);
    };

    const handleClick = (e: React.MouseEvent) => {
        if (isOverlay) {
            e.preventDefault();
            return;
        }

        if (isEditing) {
            e.preventDefault();
            e.stopPropagation();
            toggleTagSelection(tag.id);
            return;
        }

        e.preventDefault();
        if (onClick) {
            onClick(tag);
        }
    };

    // 渲染四宫格中的单个图标
    const renderGridIcon = (index: number) => {
        if (index >= childIcons.length) {
            return null;
        }

        const icon = childIcons[index];
        const child = tag.children?.[index];
        if (!child) return null;

        const bg = child.isSystem ? 'rgb(255, 255, 255)' : (child.backgroundColor ?? "rgb(255, 255, 255)");
        const userScale = child.iconSize || 1;
        const scale = child.icon && child.icon.length < 4 ? 1.2 * userScale : 0.7 * userScale;

        // 系统图标特殊缩放
        const finalScale = child.isSystem ? 0.6 * userScale : scale;

        return (
            <ItemIcon
                title={child.title}
                icon={child.icon}
                // Grid cell iconDataUrl resolution: currently FolderItem uses childIcons array which are strings (url/emoji).
                // `icon` prop handles this. `iconDataUrl` is usually for cached blobs.
                // In useEffect above, `childIcons` are populated with URLs.
                // We pass `icon` prop as the source.
                // Wait, logic in useEffect (L46) resolves favicon URL if needed. 
                // `childIcons` state holds the resolved string.
                // But `ItemIcon` expects `icon` (original) and maybe `iconDataUrl`.
                // Here `childIcons[index]` IS the resolved URL/Emoji.
                iconDataUrl={child.isSystem ? undefined : icon}
                // If it is system, icon is the ID.
                isSystem={child.isSystem}
                backgroundColor={bg}
                scale={finalScale}
                className="w-full h-full rounded-sm"
            />
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
            {/* 操作按钮容器 */}
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
                onClick={handleClick} // ItemIcon extends HTML attributes
                className={cn(
                    "relative flex items-center justify-center w-14 h-14 rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden",
                    "bg-white/10 backdrop-blur-md border border-white/20",
                    isEditing ? "cursor-pointer" : "cursor-pointer",
                    isOverlay && "cursor-grabbing shadow-xl",
                    isSelected && "ring-2 ring-primary ring-offset-2"
                )}
            // No icon, acts as container
            >
                {/* 高斯模糊背景层 */}
                <div className="absolute inset-0 bg-white/5 backdrop-blur-xl" />

                {/* 四宫格内容 */}
                <div className="relative z-10 w-11 h-11 grid grid-cols-2 grid-rows-2 gap-0.5 p-1">
                    {[0, 1, 2, 3].map((index) => (
                        <div key={index} className="w-full h-full">
                            {renderGridIcon(index)}
                        </div>
                    ))}
                </div>

                {/* 选中态遮罩 - 中心显示圆形框 */}
                {isEditing && (
                    <div className={cn(
                        "absolute inset-0 z-30 flex items-center justify-center transition-all bg-black/5",
                        isSelected ? "opacity-100" : "opacity-0 hover:opacity-100"
                    )}>
                        <div className={cn(
                            "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                            isSelected
                                ? "bg-primary border-primary scale-110 shadow-lg text-white"
                                : "border-white/50 bg-black/20"
                        )}>
                            {isSelected && <Check size={14} strokeWidth={3} />}
                        </div>
                    </div>
                )}
            </ItemIcon>

            <span className="text-xs text-center font-medium truncate w-full max-w-[80px] drop-shadow-sm text-white select-none">
                {tag.title}
            </span>
        </div>
    );
}

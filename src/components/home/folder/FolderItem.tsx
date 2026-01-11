import { useAppStore, type Tag } from "@/lib/store";
import { X, Edit2 } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface FolderItemProps {
    tag: Tag;
    onEdit: (tag: Tag) => void;
    onClick?: (tag: Tag) => void;
    isOverlay?: boolean;
}

export function FolderItem({ tag, onEdit, onClick, isOverlay }: FolderItemProps) {
    const removeTag = useAppStore((state) => state.removeTag);
    const isEditing = useAppStore((state) => state.isEditing);
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
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0 : 1,
        zIndex: isOverlay ? 100 : undefined,
    };

    // 加载子项的图标
    useEffect(() => {
        const children = tag.children || [];
        const icons = children.slice(0, 4).map(child => {
            if (child.icon && child.icon.length < 4) {
                return child.icon; // emoji
            }
            return child.icon || `https://www.google.com/s2/favicons?domain=${child.url}&sz=64`;
        });
        setChildIcons(icons);
    }, [tag.children]);

    const handleDelete = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (confirm(`Delete folder "${tag.title}" and all its contents?`)) {
            removeTag(tag.id);
        }
    };

    const handleEdit = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onEdit(tag);
    };

    const handleClick = (e: React.MouseEvent) => {
        if (isEditing || isOverlay) {
            e.preventDefault();
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
            // 空位不显示任何内容
            return null;
        }

        const icon = childIcons[index];
        const child = tag.children?.[index];

        const bg = child?.backgroundColor ?? "rgb(255, 255, 255)";

        // 判断是否为 emoji
        if (child?.icon && child.icon.length < 4) {
            return (
                <div
                    className="w-full h-full flex items-center justify-center rounded-md overflow-hidden"
                    style={{ backgroundColor: bg }}
                >
                    <span className="text-xs">{icon}</span>
                </div>
            );
        }

        // 网站图标
        return (
            <div
                className="w-full h-full rounded-md overflow-hidden flex items-center justify-center"
                style={{ backgroundColor: bg }}
            >
                <img
                    src={icon}
                    alt=""
                    className="w-3 h-3 object-contain"
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12"><rect width="12" height="12" fill="%23ddd"/></svg>';
                    }}
                />
            </div>
        );
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "group relative flex flex-col items-center gap-1.5",
                isEditing && !isDragging && !isOverlay && "animate-[shake_0.5s_ease-in-out_infinite]",
                isOverlay && "scale-110 rotate-3 cursor-grabbing"
            )}
            {...(isOverlay ? {} : attributes)}
            {...(isOverlay ? {} : listeners)}
        >
            {/* 操作按钮容器 */}
            <div className={cn(
                "absolute -top-2 right-2 flex gap-1 transition-all z-20 p-1 rounded-full bg-background/50 backdrop-blur-md border shadow-sm",
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

            <button
                onClick={handleClick}
                className={cn(
                    "relative flex items-center justify-center w-14 h-14 rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden",
                    "bg-white/10 backdrop-blur-md border border-white/20",
                    isEditing ? "cursor-move" : "cursor-pointer",
                    isOverlay && "cursor-grabbing shadow-xl"
                )}
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
            </button>

            <span className="text-xs text-center font-medium truncate w-full max-w-[80px] drop-shadow-sm text-white">
                {tag.title}
            </span>
        </div>
    );
}

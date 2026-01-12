import { type Tag } from "@/store/core/types";
import { useUIStore } from "@/store/modules/ui";
import { useTagStore } from "@/store/modules/tag";
import { X, Edit2 } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { backgroundStorage } from "@/store/core/backgroundStorage";
import { renderSystemIcon } from "@/components/items";

interface TagItemProps {
    tag: Tag;
    onEdit: (tag: Tag) => void;
    onClick?: (tag: Tag) => void;
    isOverlay?: boolean;
}

export function TagItem({ tag, onEdit, onClick, isOverlay }: TagItemProps) {
    const removeTag = useTagStore((state) => state.removeTag);
    const isEditing = useUIStore((state) => state.isEditing);
    const [bgColor, setBgColor] = useState(() => tag.backgroundColor ?? "rgb(255, 255, 255)");
    const [imageDataUrl, setImageDataUrl] = useState<string>("");

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
        transform: isOverlay ? undefined : CSS.Transform.toString(transform),
        transition: isOverlay ? undefined : transition,
        opacity: isDragging ? 0 : 1,
        zIndex: isOverlay ? 100 : undefined,
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (confirm(`Delete ${tag.isSystem ? 'system icon' : 'shortcut'} "${tag.title}"?`)) {
            removeTag(tag.id);
        }
    };

    const handleEdit = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        // 系统图标不允许编辑
        if (tag.isSystem) return;
        onEdit(tag);
    };

    const handleClick = (e: React.MouseEvent) => {
        if (isEditing || isOverlay) {
            e.preventDefault();
            return;
        }

        if (tag.isSystem && onClick) {
            e.preventDefault();
            onClick(tag);
        }
    };

    const renderIcon = () => {
        const scale = tag.iconSize || 1;
        const iconStyle = { transform: `scale(${scale})` };

        // 系统图标渲染
        if (tag.isSystem && tag.icon) {
            // 系统图标通常是 react node，这里 renderSystemIcon 返回的是 JSX
            // 我们可以在外层包裹并 scale
            return (
                <div style={iconStyle} className="text-muted-foreground flex items-center justify-center">
                    {renderSystemIcon(tag.icon, "")}
                </div>
            );
        }

        // 普通图标渲染 - Emoji
        if (tag.icon && tag.icon.length < 4) {
            return <span className="text-2xl select-none" style={iconStyle}>{tag.icon}</span>;
        }

        // 图片图标
        return (
            <img
                src={imageDataUrl || faviconUrl}
                alt={tag.title}
                className="w-10 h-10 object-contain pointer-events-none select-none"
                style={iconStyle}
            />
        );
    };

    const faviconUrl = tag.icon || `https://www.google.com/s2/favicons?domain=${tag.url}&sz=64`;


    useEffect(() => {
        let cancelled = false;

        const resolveIcon = async () => {
            if (tag.iconDataUrl?.startsWith("idb://")) {
                const key = tag.iconDataUrl.replace("idb://", "");
                try {
                    const data = await backgroundStorage.getIcon(key);
                    if (!cancelled && data) {
                        setImageDataUrl(data);
                    }
                } catch (e) {
                    console.error("Failed to load icon from IDB:", e);
                }
            } else if (tag.iconDataUrl) {
                setImageDataUrl(tag.iconDataUrl);
            } else {
                setImageDataUrl("");
            }
        };

        setBgColor(tag.backgroundColor ?? "rgb(255, 255, 255)");
        resolveIcon();

        return () => {
            cancelled = true;
        };
    }, [tag.iconDataUrl, tag.backgroundColor]);

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
                {!tag.isSystem && (
                    <button
                        onClick={handleEdit}
                        className="p-1 bg-primary text-primary-foreground rounded-full shadow-sm hover:scale-110 transition-transform cursor-pointer"
                        title="Edit"
                    >
                        <Edit2 size={10} />
                    </button>
                )}
                <button
                    onClick={handleDelete}
                    className="p-1 bg-destructive text-destructive-foreground rounded-full shadow-sm hover:scale-110 transition-transform cursor-pointer"
                    title="Remove"
                >
                    <X size={10} />
                </button>
            </div>

            <a
                href={tag.isSystem ? '#' : tag.url}
                target={tag.isSystem ? '_self' : '_blank'}
                rel={tag.isSystem ? undefined : 'noreferrer'}
                onClick={(e) => {
                    if (isEditing || isOverlay) {
                        e.preventDefault();
                        return;
                    }
                    if (tag.isSystem) {
                        handleClick(e);
                    }
                }}
                className={cn(
                    "flex items-center justify-center w-14 h-14 rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden relative",
                    isEditing ? "cursor-move" : "cursor-pointer",
                    isOverlay && "cursor-grabbing shadow-xl"
                )}
                style={{ backgroundColor: tag.isSystem ? 'rgb(255, 255, 255)' : bgColor }}
            >
                {/* 棋盘格背景，用于展示透明效果。放在最底层 */}


                <div className="relative z-10 flex items-center justify-center w-full h-full">
                    {renderIcon()}
                </div>
            </a>

            <span className="text-xs text-center font-medium truncate w-full max-w-[80px] drop-shadow-sm text-white select-none">
                {tag.title}
            </span>
        </div>
    );
}

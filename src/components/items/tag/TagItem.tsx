import { type Tag } from "@/store/core/types";
import { useUIStore } from "@/store/modules/ui";
import { X, Edit2, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { backgroundStorage } from "@/store/core/backgroundStorage";
import { renderSystemIcon } from "@/components/items";
import { useTranslation } from "react-i18next";

interface TagItemProps {
    tag: Tag;
    onEdit: (tag: Tag) => void;
    onDeletePrompt: (tag: Tag) => void;
    onClick?: (tag: Tag) => void;
    isOverlay?: boolean;
    isNearTarget?: boolean;
    isHoverTarget?: boolean;
}

export function TagItem({ tag, onEdit, onDeletePrompt, onClick, isOverlay, isNearTarget, isHoverTarget }: TagItemProps) {
    const { t } = useTranslation();
    const { isEditing, selectedTagIds, toggleTagSelection } = useUIStore();
    const isSelected = selectedTagIds.includes(tag.id);

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
        transform: (isNearTarget || isHoverTarget || !transform) ? undefined : CSS.Translate.toString(transform),
        transition: isDragging ? undefined : transition,
        opacity: isDragging ? 0 : 1,
        zIndex: isOverlay ? 100 : undefined,
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onDeletePrompt(tag);
    };

    const handleEdit = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (tag.isSystem) return;
        onEdit(tag);
    };

    const handleItemClick = (e: React.MouseEvent) => {
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

        if (tag.isSystem && onClick) {
            e.preventDefault();
            onClick(tag);
        } else if (tag.url) {
            window.open(tag.url, '_blank');
        }
    };

    const renderIcon = () => {
        const scale = tag.iconSize || 1;
        const iconStyle = { transform: `scale(${scale})` };

        if (tag.isSystem && tag.icon) {
            return (
                <div style={iconStyle} className="text-muted-foreground flex items-center justify-center">
                    {renderSystemIcon(tag.icon, "")}
                </div>
            );
        }

        if (tag.icon && tag.icon.length < 4) {
            return <span className="text-2xl select-none" style={iconStyle}>{tag.icon}</span>;
        }

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
                "group flex flex-col items-center gap-1.5",
                isEditing && !isDragging && !isOverlay && "animate-[shake_0.5s_ease-in-out_infinite]",
                isOverlay && "scale-110 rotate-3 cursor-grabbing"
            )}
            {...(isOverlay ? {} : attributes)}
            {...(isOverlay ? {} : listeners)}
        >
            <div className="relative">
                {/* 操作按钮容器 */}
                <div className={cn(
                    "absolute -top-3 -right-3 flex gap-1 transition-all z-20 p-1 rounded-full bg-background/50 backdrop-blur-md border shadow-sm",
                    (isEditing && !isOverlay) ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
                )}>
                    {!tag.isSystem && (
                        <button
                            onClick={handleEdit}
                            className="p-1 bg-primary text-primary-foreground rounded-full shadow-sm hover:scale-110 transition-transform cursor-pointer"
                            title={t('edit')}
                        >
                            <Edit2 size={10} />
                        </button>
                    )}
                    <button
                        onClick={handleDelete}
                        className="p-1 bg-destructive text-destructive-foreground rounded-full shadow-sm hover:scale-110 transition-transform cursor-pointer"
                        title={t('remove')}
                    >
                        <X size={10} />
                    </button>
                </div>

                <div
                    role="button"
                    tabIndex={0}
                    onClick={handleItemClick}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            handleItemClick(e as any);
                        }
                    }}
                    className={cn(
                        "flex items-center justify-center w-14 h-14 rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden relative",
                        isEditing ? "cursor-pointer" : "cursor-pointer",
                        isOverlay && "cursor-grabbing shadow-xl",
                        isSelected && "ring-2 ring-primary ring-offset-2"
                    )}
                    style={{ backgroundColor: tag.isSystem ? 'rgb(255, 255, 255)' : bgColor }}
                >
                    <div className="relative z-10 flex items-center justify-center w-full h-full">
                        {renderIcon()}
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
                </div>
            </div>

            <span className="text-xs text-center font-medium truncate w-full max-w-[80px] drop-shadow-sm text-white select-none">
                {tag.title}
            </span>
        </div>
    );
}

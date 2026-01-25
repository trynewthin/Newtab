import { useUIStore } from "@/features/launcher/store/ui";
import { X, Edit2, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/core/utils";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { backgroundStorage } from "@/store/core/backgroundStorage";
import { ItemIcon } from "../base/ItemIcon";
import { useTranslation } from "react-i18next";
import type { WebTagItem, GridItem } from "@/store/core/itemTypes";

interface TagItemProps {
    item: WebTagItem;
    onEdit: (item: WebTagItem) => void;
    onDeletePrompt: (item: GridItem) => void;
    onClick?: (item: GridItem) => void;
    isOverlay?: boolean;
    isNearTarget?: boolean;
    isHoverTarget?: boolean;
}

export function TagItem({ item, onEdit, onDeletePrompt, onClick, isOverlay, isNearTarget, isHoverTarget }: TagItemProps) {
    const { t } = useTranslation();
    const { isEditing, selectedTagIds, toggleTagSelection } = useUIStore();
    const isSelected = selectedTagIds.includes(item.id);

    const [bgColor, setBgColor] = useState(() => item.backgroundColor ?? "transparent");
    const [imageDataUrl, setImageDataUrl] = useState<string>("");

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

    const handleItemClick = (e: React.MouseEvent) => {
        if (isOverlay) {
            e.preventDefault();
            return;
        }

        if (isEditing) {
            e.preventDefault();
            e.stopPropagation();
            toggleTagSelection(item.id);
            return;
        }

        if (onClick) {
            e.preventDefault();
            onClick(item);
        } else if (item.url) {
            window.open(item.url, '_blank');
        }
    };

    const faviconUrl = item.icon || `https://www.google.com/s2/favicons?domain=${item.url}&sz=64`;

    useEffect(() => {
        let cancelled = false;

        const resolveIcon = async () => {
            if (item.iconDataUrl?.startsWith("idb://")) {
                const key = item.iconDataUrl.replace("idb://", "");
                try {
                    const data = await backgroundStorage.getIcon(key);
                    if (!cancelled && data) {
                        setImageDataUrl(data);
                    }
                } catch (e) {
                    console.error("Failed to load icon from IDB:", e);
                }
            } else if (item.iconDataUrl) {
                setImageDataUrl(item.iconDataUrl);
            } else {
                setImageDataUrl("");
            }
        };

        setBgColor(item.backgroundColor ?? "transparent");
        resolveIcon();

        return () => {
            cancelled = true;
        };
    }, [item.iconDataUrl, item.backgroundColor, item.id]);

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "group flex flex-col items-center gap-1.5 w-14",
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
                    <button
                        onClick={handleEdit}
                        className="p-1.5 bg-primary text-primary-foreground rounded-full shadow-sm hover:scale-110 transition-transform cursor-pointer"
                        title={t('edit')}
                    >
                        <Edit2 size={10} />
                    </button>
                    <button
                        onClick={handleDelete}
                        className="p-1.5 bg-destructive text-destructive-foreground rounded-full shadow-sm hover:scale-110 transition-transform cursor-pointer"
                        title={t('remove')}
                    >
                        <X size={10} />
                    </button>
                </div>

                <ItemIcon
                    title={item.title}
                    icon={item.icon}
                    iconDataUrl={imageDataUrl || faviconUrl}
                    isSystem={false}
                    scale={item.iconSize || 1.3}
                    backgroundColor={bgColor}
                    className={cn(
                        "w-14 h-14 rounded-2xl shadow-lg hover:shadow-xl transition-shadow",
                        isEditing ? "cursor-pointer" : "cursor-pointer",
                        isOverlay && "cursor-grabbing shadow-2xl",
                        isSelected && "shadow-[0_0_0_2px_rgba(var(--color-primary),1),0_0_12px_rgba(var(--color-primary),0.5)]"
                    )}
                    role="button"
                    tabIndex={0}
                    onClick={handleItemClick}
                    onKeyDown={(e: React.KeyboardEvent) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            handleItemClick(e as any);
                        }
                    }}
                >
                    {isEditing && (
                        <div className={cn(
                            "absolute inset-0 z-30 flex items-center justify-center transition-all pointer-events-none",
                            isSelected ? "bg-black/5" : ""
                        )}>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    toggleTagSelection(item.id);
                                }}
                                className={cn(
                                    "pointer-events-auto w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all",
                                    isSelected
                                        ? "bg-primary border-primary scale-110 shadow-lg text-white"
                                        : "border-white/50 bg-black/20 hover:bg-black/30 hover:border-white/70 hover:scale-105"
                                )}
                            >
                                {isSelected && <Check size={16} strokeWidth={3} />}
                            </button>
                        </div>
                    )}
                </ItemIcon>
            </div>

            <span className="text-xs text-center font-medium truncate w-full max-w-[80px] drop-shadow-md text-white select-none">
                {item.title}
            </span>
        </div>
    );
}

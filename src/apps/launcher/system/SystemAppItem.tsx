import { cn } from "@/platform/core/utils";
import { ItemIcon } from "../base/ItemIcon";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTranslation } from "react-i18next";
import { useUIStore } from "@/apps/launcher/store/ui";
import { Check } from "lucide-react";
import { useRef } from "react";
import { ItemActionMenu } from "../base/ItemActionMenu";
import {
    ITEM_HOVER_SCALE_CLASS,
    ITEM_INTERACTION_ANIMATION_CLASS,
    ITEM_SELECTED_SCALE_CLASS,
} from "../base/selectionStyles";

export interface SystemAppItemProps {
    id: string; // 用于 DND
    title: string;
    icon: string; // 图标资源路径或 ID
    onClick: (event?: React.MouseEvent) => void;

    // DND & Interaction states
    isOverlay?: boolean;
    isNearTarget?: boolean;
    isHoverTarget?: boolean;
    className?: string;
    onPrefetch?: () => void;
    sortableEnabled?: boolean;
    onEdit?: () => void;
    onDelete?: () => void;
}

export function SystemAppItem({
    id,
    title,
    icon,
    onClick,
    isOverlay,
    isNearTarget,
    isHoverTarget,
    className,
    onPrefetch,
    sortableEnabled = true,
    onEdit,
    onDelete,
}: SystemAppItemProps) {
    const { t } = useTranslation();
    const { isEditing, selectedTagIds, toggleTagSelection } = useUIStore();
    const isSelected = selectedTagIds.includes(id);
    const hasPrefetchedRef = useRef(false);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: id,
        disabled: !!isOverlay || !sortableEnabled,
    });

    const style = {
        transform: (!sortableEnabled || isNearTarget || isHoverTarget || !transform) ? undefined : CSS.Translate.toString(transform),
        transition: !sortableEnabled || isDragging ? undefined : transition,
        opacity: !sortableEnabled ? 1 : (isDragging ? 0 : 1),
        zIndex: isOverlay ? 100 : undefined,
    };

    const handleClick = (e: React.MouseEvent) => {
        if (isOverlay) {
            e.preventDefault();
            return;
        }

        if (isEditing) {
            e.preventDefault();
            e.stopPropagation();
            toggleTagSelection(id);
            return;
        }

        e.preventDefault();
        e.stopPropagation();
        onClick(e);
    };

    const triggerPrefetch = () => {
        if (hasPrefetchedRef.current || !onPrefetch) return;
        hasPrefetchedRef.current = true;
        onPrefetch();
    };

    const handleEdit = () => {
        onEdit?.();
    };

    const handleDelete = () => {
        onDelete?.();
    };

    // 如果标题是系统 Key，则进行动态翻译，以支持语言即时切换
    const displayTitle = title?.startsWith('sys_') ? t(title) : title;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "group relative flex flex-col items-center gap-1.5 w-14",
                isEditing && !isDragging && !isOverlay && "animate-[shake_0.5s_ease-in-out_infinite]",
                isOverlay && "scale-110 rotate-3 cursor-grabbing",
                className
            )}
            {...(isOverlay ? {} : attributes)}
            {...(isOverlay ? {} : listeners)}
        >
            <div className="relative">
                <ItemActionMenu
                    disabled={!!isOverlay}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    editLabel={t("edit")}
                    deleteLabel={t("remove")}
                >
                    <ItemIcon
                        title={displayTitle}
                        icon={icon}
                        isSystem={true} // 告诉 ItemIcon 这是一个系统应用，它会处理系统图标的渲染逻辑
                        scale={0.85} // Reduced scale for minimalist look
                        // Light: White BG, Black Icon
                        // Dark: Black BG, White Icon
                        // Use !important to override inline style backgroundColor="transparent" from ItemIcon default
                        className={cn(
                            "w-14 h-14 rounded-2xl shadow-lg hover:shadow-xl transition-shadow transition-colors duration-300",
                            "!bg-white dark:!bg-black",
                            "text-black dark:text-white",
                            "cursor-pointer",
                            isOverlay && "cursor-grabbing shadow-2xl",
                            ITEM_INTERACTION_ANIMATION_CLASS,
                            ITEM_HOVER_SCALE_CLASS,
                            isSelected && ITEM_SELECTED_SCALE_CLASS
                        )}
                        role="button"
                        onClick={handleClick}
                        onMouseEnter={triggerPrefetch}
                        onFocus={triggerPrefetch}
                        onTouchStart={triggerPrefetch}
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
                                        toggleTagSelection(id);
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
                </ItemActionMenu>
            </div>

            <span className="text-xs text-center font-medium truncate w-full max-w-[80px] drop-shadow-md text-white select-none">
                {displayTitle}
            </span>
        </div>
    );
}


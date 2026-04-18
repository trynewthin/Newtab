import { useAppearancePreferenceStore } from "@/config";
import { useUIStore } from "@/launcher/store/ui.store";
import { Check } from "lucide-react";
import { cn } from "@/shared/utils";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ItemIcon } from "./ItemIcon";
import { ItemActionMenu, type ItemActionMenuItem } from "./ItemActionMenu";
import {
    ITEM_HOVER_SCALE_CLASS,
    ITEM_INTERACTION_ANIMATION_CLASS,
    ITEM_SELECTED_SCALE_CLASS,
} from "./selectionStyles";
import { useTranslation } from "react-i18next";

export interface AppTileIconDescriptor {
    title: string;
    icon?: string;
    iconDataUrl?: string;
    isSystem?: boolean;
    scale?: number;
    backgroundColor?: string;
    iconClassName?: string;
    customContent?: React.ReactNode;
}

export interface AppTileProps {
    id: string;
    displayTitle: string;
    iconDescriptor: AppTileIconDescriptor;
    onClick: (event?: React.MouseEvent | React.KeyboardEvent) => void;
    onEdit: () => void;
    onDelete: () => void;
    extraMenuItems?: ItemActionMenuItem[];
    onPrefetch?: () => void;
    isOverlay?: boolean;
    isNearTarget?: boolean;
    isHoverTarget?: boolean;
    sortableEnabled?: boolean;
}

export function AppTile({
    id,
    displayTitle,
    iconDescriptor,
    onClick,
    onEdit,
    onDelete,
    extraMenuItems,
    onPrefetch,
    isOverlay,
    isNearTarget,
    isHoverTarget,
    sortableEnabled = true,
}: AppTileProps) {
    const { t } = useTranslation();
    const { isEditing, selectedTagIds, toggleTagSelection } = useUIStore();
    const iconLabelHidden = useAppearancePreferenceStore((state) => state.iconLabelHidden);
    const isSelected = selectedTagIds.includes(id);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id,
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
        onClick(e);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (!isOverlay && !isEditing) {
                onClick(e);
            } else if (isEditing) {
                toggleTagSelection(id);
            }
        }
    };

    const triggerPrefetch = onPrefetch
        ? (() => {
            let done = false;
            return () => {
                if (done) return;
                done = true;
                onPrefetch();
            };
        })()
        : undefined;

    const desc = iconDescriptor;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "group relative flex w-14 flex-col items-center",
                iconLabelHidden ? "gap-0" : "gap-1.5",
                isEditing && !isDragging && !isOverlay && "animate-[shake_0.5s_ease-in-out_infinite]",
                isOverlay && "scale-110 rotate-3 cursor-grabbing"
            )}
            {...(isOverlay ? {} : attributes)}
            {...(isOverlay ? {} : listeners)}
        >
            <div className="relative">
                <ItemActionMenu
                    disabled={!!isOverlay}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    editLabel={t("edit")}
                    deleteLabel={t("remove")}
                    extraItems={extraMenuItems}
                >
                    <ItemIcon
                        title={desc.title}
                        icon={desc.icon}
                        iconDataUrl={desc.iconDataUrl}
                        isSystem={desc.isSystem}
                        scale={desc.scale}
                        backgroundColor={desc.backgroundColor}
                        className={cn(
                            "h-14 w-14 rounded-[18px] shadow-lg transition-shadow hover:shadow-xl",
                            "cursor-pointer",
                            isOverlay && "cursor-grabbing shadow-2xl",
                            ITEM_INTERACTION_ANIMATION_CLASS,
                            ITEM_HOVER_SCALE_CLASS,
                            isSelected && ITEM_SELECTED_SCALE_CLASS,
                            desc.iconClassName
                        )}
                        role="button"
                        tabIndex={0}
                        onClick={handleClick}
                        onKeyDown={handleKeyDown}
                        onMouseEnter={triggerPrefetch}
                        onFocus={triggerPrefetch}
                        onTouchStart={triggerPrefetch}
                    >
                        {desc.customContent}

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
                                        "pointer-events-auto flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all",
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

            {!iconLabelHidden ? (
                <span className="w-full max-w-[80px] truncate text-center text-xs font-medium text-white drop-shadow-md select-none">
                    {displayTitle}
                </span>
            ) : null}
        </div>
    );
}

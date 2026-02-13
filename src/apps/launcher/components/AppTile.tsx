import { useUIStore } from "@/apps/launcher/store/ui";
import { Check } from "lucide-react";
import { cn } from "@/core/utils";
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

// ─── Icon descriptor ────────────────────────────────────────────────
// Each app-tile kind provides its own icon descriptor so AppTile
// doesn't need to know about tag/system/folder internals.

export interface AppTileIconDescriptor {
    /** ItemIcon props */
    title: string;
    icon?: string;
    iconDataUrl?: string;
    isSystem?: boolean;
    scale?: number;
    backgroundColor?: string;
    /** Extra className applied to ItemIcon (e.g. system app bg override) */
    iconClassName?: string;
    /** Completely custom icon content (e.g. folder 4-grid preview) */
    customContent?: React.ReactNode;
}

// ─── Props ──────────────────────────────────────────────────────────

export interface AppTileProps {
    id: string;
    displayTitle: string;
    iconDescriptor: AppTileIconDescriptor;

    onClick: (event?: React.MouseEvent | React.KeyboardEvent) => void;
    onEdit: () => void;
    onDelete: () => void;

    /** Extra context-menu items (e.g. folder "switch display mode") */
    extraMenuItems?: ItemActionMenuItem[];

    /** Prefetch callback (e.g. system app modal preload) */
    onPrefetch?: () => void;

    // DND & interaction states (passed through from grid)
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

    // ─── Click handling ─────────────────────────────────────────────
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

    // ─── Prefetch ───────────────────────────────────────────────────
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

    // ─── Icon props ─────────────────────────────────────────────────
    const desc = iconDescriptor;

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
                            "w-14 h-14 rounded-[18px] shadow-lg hover:shadow-xl transition-shadow",
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
                        {/* Custom icon content (e.g. folder grid preview) */}
                        {desc.customContent}

                        {/* Editing selection overlay */}
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

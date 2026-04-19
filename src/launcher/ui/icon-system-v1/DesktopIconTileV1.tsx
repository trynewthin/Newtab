import { useAppearancePreferenceStore } from "@/config";
import { useUIStore } from "@/launcher/store/ui.store";
import { ItemActionMenu, type ItemActionMenuItem } from "@/launcher/ui/components/ItemActionMenu";
import {
    ITEM_HOVER_SCALE_CLASS,
    ITEM_INTERACTION_ANIMATION_CLASS,
    ITEM_SELECTED_SCALE_CLASS,
} from "@/launcher/ui/components/selectionStyles";
import { Check } from "lucide-react";
import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { cn } from "@/shared/utils";
import {
    LAUNCHER_ICON_VISUAL_CLASS_V1,
    LAUNCHER_ICON_VISUAL_INTERACTIVE_CLASS_V1,
} from "./iconVisualStyles";
import type { LauncherIconSeedV1 } from "./types";
import { LauncherIconVisualV1 } from "./LauncherIconVisualV1";
import { useResolvedLauncherIconV1 } from "./useResolvedLauncherIconsV1";

export interface DesktopIconTileV1Props {
    id: string;
    displayTitle: string;
    iconSeed: LauncherIconSeedV1;
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

export function DesktopIconTileV1({
    id,
    displayTitle,
    iconSeed,
    onClick,
    onEdit,
    onDelete,
    extraMenuItems,
    onPrefetch,
    isOverlay,
    isNearTarget,
    isHoverTarget,
    sortableEnabled = true,
}: DesktopIconTileV1Props) {
    const icon = useResolvedLauncherIconV1(iconSeed);
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
                    extraItems={extraMenuItems}
                >
                    <div className="relative">
                        <LauncherIconVisualV1
                            icon={icon}
                            className={cn(
                                LAUNCHER_ICON_VISUAL_CLASS_V1,
                                LAUNCHER_ICON_VISUAL_INTERACTIVE_CLASS_V1,
                                "cursor-pointer",
                                isOverlay && "cursor-grabbing shadow-2xl",
                                ITEM_INTERACTION_ANIMATION_CLASS,
                                ITEM_HOVER_SCALE_CLASS,
                                isSelected && ITEM_SELECTED_SCALE_CLASS
                            )}
                            role="button"
                            tabIndex={0}
                            onClick={handleClick}
                            onKeyDown={handleKeyDown}
                            onMouseEnter={triggerPrefetch}
                            onFocus={triggerPrefetch}
                            onTouchStart={triggerPrefetch}
                        />

                        {isEditing ? (
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
                                    {isSelected ? <Check size={16} strokeWidth={3} /> : null}
                                </button>
                            </div>
                        ) : null}
                    </div>
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

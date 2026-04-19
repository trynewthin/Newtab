import { useAppearancePreferenceStore } from "@/config";
import { useUIStore } from "@/launcher/store/ui.store";
import { ItemActionMenu, type ItemActionMenuItem } from "@/launcher/ui/components/ItemActionMenu";
import {
    ITEM_HOVER_SCALE_CLASS,
    ITEM_INTERACTION_ANIMATION_CLASS,
    ITEM_SELECTED_SCALE_CLASS,
} from "@/launcher/ui/components/selectionStyles";
import { AppSurface } from "@/platform/ui";
import { Check } from "lucide-react";
import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { cn } from "@/shared/utils";
import type { FolderIconLayoutV1, LauncherIconSeedV1 } from "./types";
import { FolderIconContentV1 } from "./FolderIconContentV1";
import { IconFrameV1 } from "./IconFrameV1";
import { LauncherFolderTileV1 } from "./LauncherFolderTileV1";
import { useResolvedLauncherIconsV1 } from "./useResolvedLauncherIconsV1";

export interface DesktopFolderTileV1Props {
    id: string;
    displayTitle: string;
    iconSeeds: LauncherIconSeedV1[];
    layout: FolderIconLayoutV1;
    onClick: (event?: React.MouseEvent | React.KeyboardEvent) => void;
    onEdit: () => void;
    onDelete: () => void;
    extraMenuItems?: ItemActionMenuItem[];
    isOverlay?: boolean;
    sortableEnabled?: boolean;
}

export function DesktopFolderTileV1({
    id,
    displayTitle,
    iconSeeds,
    layout,
    onClick,
    onEdit,
    onDelete,
    extraMenuItems,
    isOverlay,
    sortableEnabled = true,
}: DesktopFolderTileV1Props) {
    const icons = useResolvedLauncherIconsV1(iconSeeds);
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
        transform: (!sortableEnabled || !transform) ? undefined : CSS.Translate.toString(transform),
        transition: !sortableEnabled || isDragging ? undefined : transition,
        opacity: !sortableEnabled ? 1 : (isDragging ? 0 : 1),
        zIndex: isOverlay ? 100 : undefined,
    };

    const handleClick = (e: React.MouseEvent) => {
        if (isOverlay) {
            e.preventDefault();
            return;
        }

        if (layout === "compact" && isEditing) {
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

            if (layout === "compact" && isEditing) {
                toggleTagSelection(id);
                return;
            }

            if (!isOverlay) {
                onClick(e);
            }
        }
    };

    if (layout === "expanded") {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className={cn(
                    "group relative h-full w-full",
                    isEditing && !isDragging && !isOverlay && "animate-[shake_0.5s_ease-in-out_infinite]",
                    isOverlay && "scale-105 rotate-1 cursor-grabbing"
                )}
                {...(isOverlay ? {} : attributes)}
                {...(isOverlay ? {} : listeners)}
            >
                <ItemActionMenu
                    disabled={!!isOverlay}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    extraItems={extraMenuItems}
                >
                    <div
                        role="button"
                        tabIndex={0}
                        onClick={handleClick}
                        onKeyDown={handleKeyDown}
                        className={cn(
                            "h-full w-full cursor-pointer",
                            isOverlay && "cursor-grabbing",
                            ITEM_INTERACTION_ANIMATION_CLASS
                        )}
                    >
                        <LauncherFolderTileV1
                            displayTitle={displayTitle}
                            icons={icons}
                            layout="expanded"
                            hideLabel
                            className="h-full w-full"
                            visualClassName="h-full w-full"
                        />
                    </div>
                </ItemActionMenu>
            </div>
        );
    }

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
                        <IconFrameV1
                            backgroundLayer={<AppSurface variant="widget" borderRadius={16} className="h-full w-full" />}
                            className={cn(
                                "h-14 w-14 rounded-[16px]",
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
                        >
                            <FolderIconContentV1 icons={icons} layout="compact" />
                        </IconFrameV1>

                        {isEditing ? (
                            <div className={cn(
                                "absolute inset-0 z-30 flex items-center justify-center transition-all pointer-events-none",
                                isSelected ? "bg-black/5 rounded-[16px]" : ""
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

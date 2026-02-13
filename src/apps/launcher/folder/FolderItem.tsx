import { useUIStore } from "@/apps/launcher/store/ui";
import { useItemStore } from "@/apps/launcher/store/item";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useMemo } from "react";
import { cn } from "@/platform/core/utils";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ItemIcon } from "../base/ItemIcon";
import { ItemActionMenu } from "../base/ItemActionMenu";
import {
    ITEM_HOVER_SCALE_CLASS,
    ITEM_INTERACTION_ANIMATION_CLASS,
    ITEM_SELECTED_SCALE_CLASS,
} from "../base/selectionStyles";
import { backgroundStorage } from "@/platform/state/core/backgroundStorage";
import type { FolderItem as FolderItemType, GridItem } from "@/platform/state/core/itemTypes";
import AppSurface from "@/platform/shared/components/surface/AppSurface";
import { Maximize2, Minimize2 } from "lucide-react";

interface FolderItemProps {
    item: FolderItemType;
    onEdit: (item: FolderItemType) => void;
    onDeletePrompt: (item: GridItem) => void;
    onClick?: (item: GridItem) => void;
    isOverlay?: boolean;
    isNearTarget?: boolean;
    isHoverTarget?: boolean;
    sortableEnabled?: boolean;
}

export function FolderItem({
    item,
    onEdit,
    onDeletePrompt,
    onClick,
    isOverlay,
    isNearTarget,
    isHoverTarget,
    sortableEnabled = true,
}: FolderItemProps) {
    const FOLDER_CARD_RADIUS_PX = 16;
    const { t } = useTranslation();
    const { isEditing, selectedTagIds } = useUIStore();
    const { updateItem } = useItemStore();
    const isSelected = selectedTagIds.includes(item.id);
    const displayMode = item.displayMode ?? "1x1";
    const is2x2 = displayMode === "2x2";

    const [resolvedChildIcons, setResolvedChildIcons] = useState<Record<string, string>>({});
    const previewCount = is2x2 ? 9 : 4;
    const previewChildren = useMemo(() => item.children?.slice(0, previewCount) ?? [], [item.children, previewCount]);
    const previewSignature = useMemo(
        () => previewChildren.map((child) => {
            if (child.kind === "app") {
                return `${child.id}:app:${child.icon ?? ""}`;
            }
            return `${child.id}:tag:${child.icon ?? ""}:${child.iconDataUrl ?? ""}:${child.url ?? ""}:${child.backgroundColor ?? ""}:${child.iconSize ?? ""}`;
        }).join("|"),
        [previewChildren]
    );

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: item.id,
        disabled: !!isOverlay || !sortableEnabled,
    });

    const style = {
        transform: (!sortableEnabled || isNearTarget || isHoverTarget || !transform) ? undefined : CSS.Translate.toString(transform),
        transition: !sortableEnabled || isDragging ? undefined : transition,
        opacity: !sortableEnabled ? 1 : (isDragging ? 0 : 1),
        zIndex: isOverlay ? 100 : undefined,
    };

    useEffect(() => {
        let cancelled = false;

        const resolveIcons = async (attempt: 0 | 1) => {
            const next: Record<string, string> = {};
            let unresolvedCount = 0;

            await Promise.all(
                previewChildren.map(async (child) => {
                    if (child.kind !== "tag") return;
                    if (!child.iconDataUrl?.startsWith("idb://")) return;

                    const key = child.iconDataUrl.replace("idb://", "");
                    try {
                        const data = await backgroundStorage.getIcon(key);
                        if (!data) {
                            unresolvedCount += 1;
                            return;
                        }
                        next[child.id] = data;
                    } catch {
                        unresolvedCount += 1;
                    }
                })
            );

            if (!cancelled) {
                setResolvedChildIcons(next);

                if (attempt === 0 && unresolvedCount > 0) {
                    setTimeout(() => {
                        if (!cancelled) {
                            void resolveIcons(1);
                        }
                    }, 180);
                }
            }
        };

        void resolveIcons(0);
        return () => {
            cancelled = true;
        };
    }, [previewSignature]);

    const handleDelete = () => {
        onDeletePrompt(item);
    };

    const handleEdit = () => {
        onEdit(item);
    };

    const handleClick = (event?: React.MouseEvent | React.KeyboardEvent) => {
        if (isOverlay) {
            event?.preventDefault();
            return;
        }
        event?.preventDefault();
        if (onClick) {
            onClick(item);
        }
    };

    const handleToggleDisplayMode = () => {
        const nextMode = is2x2 ? "1x1" : "2x2";
        const size = nextMode === "2x2" ? { w: 2, h: 2 } : { w: 1, h: 1 };
        updateItem(item.id, { displayMode: nextMode, ...size } as Partial<GridItem>);
    };

    const renderGridIcon = (index: number) => {
        const child = previewChildren[index];
        if (!child) return null;

        if (child.kind === "app") {
            return (
                <ItemIcon
                    title={child.title}
                    icon={child.icon}
                    isSystem
                    scale={0.85}
                    className="w-full h-full rounded-[10px] !bg-white dark:!bg-black text-black dark:text-white"
                />
            );
        }

        const faviconUrl = child.icon || `https://www.google.com/s2/favicons?domain=${child.url}&sz=64`;
        const resolvedIconDataUrl = resolvedChildIcons[child.id]
            || (child.iconDataUrl && !child.iconDataUrl.startsWith("idb://") ? child.iconDataUrl : "")
            || faviconUrl;

        return (
            <ItemIcon
                title={child.title}
                icon={child.icon}
                iconDataUrl={resolvedIconDataUrl}
                isSystem={false}
                scale={child.iconSize || 1.3}
                backgroundColor={child.backgroundColor ?? "transparent"}
                className="w-full h-full rounded-[10px]"
            />
        );
    };

    const extraMenuItems = [
        {
            label: is2x2 ? t("folder_switch_1x1") : t("folder_switch_2x2"),
            icon: is2x2 ? <Minimize2 size={12} /> : <Maximize2 size={12} />,
            onClick: handleToggleDisplayMode,
        },
    ];

    // ─── 2x2 Panel Mode ─────────────────────────────────────────────
    if (is2x2) {
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
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    editLabel={t("edit")}
                    deleteLabel={t("remove")}
                    extraItems={extraMenuItems}
                >
                    <div
                        onClick={handleClick}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                handleClick(event);
                            }
                        }}
                        className={cn(
                            "relative flex h-full w-full items-center justify-center overflow-hidden rounded-[24px]",
                            "cursor-pointer shadow-lg transition-all duration-200 hover:shadow-xl",
                            isOverlay && "cursor-grabbing shadow-2xl",
                            ITEM_INTERACTION_ANIMATION_CLASS,
                        )}
                    >
                        <div className="pointer-events-none absolute inset-0">
                            <AppSurface
                                variant="widget"
                                borderRadius={24}
                                className="h-full w-full"
                            />
                        </div>
                        <div className="relative z-10 flex h-full w-full flex-col p-3">
                            <div className="flex-1 grid grid-cols-3 gap-[8px] content-start">
                                {previewChildren.map((_, index) => (
                                    <div
                                        key={index}
                                        className="w-full aspect-square rounded-[12px] overflow-hidden"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const child = previewChildren[index];
                                            if (child && 'url' in child && child.url) {
                                                window.open(child.url, '_blank');
                                            } else {
                                                handleClick(e);
                                            }
                                        }}
                                    >
                                        {renderGridIcon(index)}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </ItemActionMenu>
            </div>
        );
    }

    // ─── 1x1 Icon Mode (default) ────────────────────────────────────
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
            <ItemActionMenu
                disabled={!!isOverlay}
                onEdit={handleEdit}
                onDelete={handleDelete}
                editLabel={t("edit")}
                deleteLabel={t("remove")}
                extraItems={extraMenuItems}
            >
                <div
                    onClick={handleClick}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            handleClick(event);
                        }
                    }}
                    className={cn(
                        "relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-[16px]",
                        "cursor-pointer shadow-[0_10px_24px_rgba(8,24,48,0.24)] transition-all duration-200 hover:shadow-[0_14px_30px_rgba(8,24,48,0.32)]",
                        isOverlay && "cursor-grabbing shadow-2xl",
                        ITEM_INTERACTION_ANIMATION_CLASS,
                        ITEM_HOVER_SCALE_CLASS,
                        isSelected && ITEM_SELECTED_SCALE_CLASS
                    )}
                >
                    <div className="pointer-events-none absolute inset-0">
                        <AppSurface
                            variant="widget"
                            borderRadius={FOLDER_CARD_RADIUS_PX}
                            className="h-full w-full rounded-[16px]"
                        />
                    </div>
                    <div className="relative z-10 w-11 h-11 grid grid-cols-2 grid-rows-2 gap-[4px] p-[2px]">
                        {[0, 1, 2, 3].map((index) => (
                            <div
                                key={index}
                                className={cn(
                                    "w-full h-full rounded-[10px] overflow-hidden",
                                    previewChildren[index] ? "bg-transparent" : "bg-black/10 dark:bg-white/10"
                                )}
                            >
                                {renderGridIcon(index)}
                            </div>
                        ))}
                    </div>
                </div>
            </ItemActionMenu>

            <span className="text-xs text-center font-medium truncate w-full max-w-[80px] drop-shadow-md text-white select-none">
                {item.title}
            </span>
        </div>
    );
}

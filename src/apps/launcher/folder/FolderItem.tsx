import { useUIStore } from "@/apps/launcher/store/ui";
import { X, Edit2 } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { cn } from "@/platform/core/utils";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ItemIcon } from "../base/ItemIcon";
import { backgroundStorage } from "@/platform/state/core/backgroundStorage";
import type { FolderItem as FolderItemType, GridItem } from "@/platform/state/core/itemTypes";

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
    const { isEditing, selectedTagIds } = useUIStore();
    const isSelected = selectedTagIds.includes(item.id);

    const [resolvedChildIcons, setResolvedChildIcons] = useState<Record<string, string>>({});
    const previewChildren = useMemo(() => item.children?.slice(0, 4) ?? [], [item.children]);
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

    // 解析 folder 预览中 tag 的 idb:// 图标缓存；首次 miss 时短重试一次，避免“成组后需刷新”。
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

    const handleClick = (e: React.MouseEvent) => {
        if (isOverlay) {
            e.preventDefault();
            return;
        }

        // Folder logic: In editing mode, folders are NOT selectable.
        // Clicking them will still open the folder preview.
        e.preventDefault();
        if (onClick) {
            onClick(item);
        }
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
            <div className={cn(
                "absolute -top-3 -right-3 flex gap-1 transition-all z-20 p-1 rounded-full bg-background/50 backdrop-blur-md border shadow-sm",
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

            <ItemIcon
                onClick={handleClick}
                className={cn(
                    "relative flex items-center justify-center w-14 h-14 rounded-2xl border border-white/35 dark:border-white/15",
                    "bg-white/16 dark:bg-black/25 backdrop-blur-xl shadow-[0_10px_24px_rgba(8,24,48,0.24)] hover:shadow-[0_14px_30px_rgba(8,24,48,0.32)] transition-all duration-200",
                    isEditing ? "cursor-pointer" : "cursor-pointer",
                    isOverlay && "cursor-grabbing shadow-2xl",
                    isSelected && "shadow-[0_0_0_2px_rgba(var(--color-primary),1),0_0_12px_rgba(var(--color-primary),0.5)]"
                )}
            >
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
            </ItemIcon>

            <span className="text-xs text-center font-medium truncate w-full max-w-[80px] drop-shadow-md text-white select-none">
                {item.title}
            </span>
        </div>
    );
}


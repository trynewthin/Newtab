import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useItemStore } from "@/launcher/store/item";
import { backgroundStorage } from "@/platform/storage/backgroundStorage";
import { ItemIcon } from "./ItemIcon";
import { Maximize2 } from "lucide-react";
import { AppSurface } from "@/platform/ui";
import type {
    GridItem,
    WebTagItem,
    FolderItem as FolderItemType,
} from "@/launcher/model/itemTypes";
import type { AppTileIconDescriptor } from "./AppTile";
import type { ItemActionMenuItem } from "./ItemActionMenu";
import { isDefaultItemIconValue } from "@/launcher/ui/icons/defaultItemIcon.shared";
import {
    resolveItemIconScale,
    resolveSmallFolderPreviewIconScale,
} from "./itemIconScale.shared";

// ─── System App adapter ─────────────────────────────────────────────

export function useSystemAppIconDescriptor(
    title: string,
    icon: string
): AppTileIconDescriptor {
    const { t } = useTranslation();
    const displayTitle = title?.startsWith("sys_") ? t(title) : title;

    return {
        title: displayTitle,
        icon,
        isSystem: true,
        scale: 0.85,
        iconClassName: "!bg-white dark:!bg-black text-black dark:text-white",
    };
}

// ─── Web Tag adapter ────────────────────────────────────────────────

export function useTagIconDescriptor(item: WebTagItem): AppTileIconDescriptor {
    const [resolvedImageDataUrl, setResolvedImageDataUrl] = useState<string>("");

    const faviconUrl =
        item.icon && !isDefaultItemIconValue(item.icon)
            ? item.icon
            : `https://www.google.com/s2/favicons?domain=${item.url}&sz=64`;
    const bgColor = item.backgroundColor ?? "transparent";
    const imageDataUrl = item.iconDataUrl?.startsWith("idb://")
        ? resolvedImageDataUrl
        : item.iconDataUrl ?? "";

    useEffect(() => {
        let cancelled = false;

        if (!item.iconDataUrl?.startsWith("idb://")) {
            return () => {
                cancelled = true;
            };
        }

        const iconDataUrl = item.iconDataUrl;

        const resolveIcon = async () => {
            const key = iconDataUrl.replace("idb://", "");
            try {
                const data = await backgroundStorage.getIcon(key);
                if (!cancelled) {
                    setResolvedImageDataUrl(data ?? "");
                }
            } catch (e) {
                console.error("Failed to load icon from IDB:", e);
            }
        };

        void resolveIcon();

        return () => {
            cancelled = true;
        };
    }, [item.iconDataUrl]);

    return {
        title: item.title,
        icon: item.icon,
        iconDataUrl: imageDataUrl || faviconUrl,
        isSystem: false,
        scale: resolveItemIconScale(item.iconSize),
        backgroundColor: bgColor,
    };
}

// ─── Folder 1x1 adapter ────────────────────────────────────────────

const FOLDER_CARD_RADIUS_PX = 16;

export function useFolderIconDescriptor(item: FolderItemType): {
    iconDescriptor: AppTileIconDescriptor;
    extraMenuItems: ItemActionMenuItem[];
} {
    const { t } = useTranslation();
    const { updateItem } = useItemStore();

    const previewChildren = useMemo(() => item.children.slice(0, 4), [item.children]);

    const previewSignature = useMemo(
        () =>
            previewChildren
                .map((child) => {
                    if (child.kind === "app") {
                        return `${child.id}:app:${child.icon ?? ""}`;
                    }
                    return `${child.id}:tag:${child.icon ?? ""}:${child.iconDataUrl ?? ""}:${child.url ?? ""}:${child.backgroundColor ?? ""}:${child.iconSize ?? ""}`;
                })
                .join("|"),
        [previewChildren]
    );

    const [resolvedChildIcons, setResolvedChildIcons] = useState<Record<string, string>>({});

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
    }, [previewChildren, previewSignature]);

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

        const faviconUrl =
            child.icon && !isDefaultItemIconValue(child.icon)
                ? child.icon
                : `https://www.google.com/s2/favicons?domain=${child.url}&sz=64`;
        const resolvedIconDataUrl =
            resolvedChildIcons[child.id] ||
            (child.iconDataUrl && !child.iconDataUrl.startsWith("idb://")
                ? child.iconDataUrl
                : "") ||
            faviconUrl;

        return (
            <ItemIcon
                title={child.title}
                icon={child.icon}
                iconDataUrl={resolvedIconDataUrl}
                isSystem={false}
                scale={resolveSmallFolderPreviewIconScale(child.iconSize)}
                backgroundColor={child.backgroundColor ?? "transparent"}
                className="w-full h-full rounded-[10px]"
            />
        );
    };

    const handleToggleDisplayMode = () => {
        const size = { w: 2, h: 2 };
        updateItem(item.id, { displayMode: "2x2", ...size } as Partial<GridItem>);
    };

    const customContent = (
        <>
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
                        className={
                            previewChildren[index]
                                ? "w-full h-full rounded-[10px] overflow-hidden bg-transparent"
                                : "w-full h-full rounded-[10px] overflow-hidden bg-black/10 dark:bg-white/10"
                        }
                    >
                        {renderGridIcon(index)}
                    </div>
                ))}
            </div>
        </>
    );

    const iconDescriptor: AppTileIconDescriptor = {
        title: item.title,
        // Folder 1x1 uses custom content, not a single icon
        iconClassName: "!bg-transparent !shadow-none hover:!shadow-none",
        customContent,
    };

    const extraMenuItems: ItemActionMenuItem[] = [
        {
            label: t("folder_switch_2x2"),
            icon: <Maximize2 size={12} />,
            onClick: handleToggleDisplayMode,
        },
    ];

    return { iconDescriptor, extraMenuItems };
}

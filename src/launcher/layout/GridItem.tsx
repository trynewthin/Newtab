import type {
    GridItem as GridItemType,
    WebTagItem,
    FolderItem as FolderItemType,
    LauncherWidgetItem,
} from "@/launcher/model/itemTypes";
import { isSystemAppId } from "@/launcher/registry/appManifest";
import { preloadModalRuntime } from "@/launcher/runtime/appRuntimeRegistry";
import { useItemStore } from "@/launcher/store/item";
import { LauncherWidgetItem as LauncherWidgetRenderer } from "@/launcher/ui/widgets";
import { GRID_ITEM_PRESETS, resolveGridPreset } from "@/launcher/layout/layoutPresets";
import {
    DesktopFolderTileV1,
    DesktopIconTileV1,
    resolveFolderChildIconSeedsV1,
    resolveSystemAppIconSeedV1,
    resolveTagIconSeedV1,
} from "@/launcher/ui/icon-system-v1";
import { Maximize2, Minimize2 } from "lucide-react";
import { useTranslation } from "react-i18next";

interface GridItemProps {
    item: GridItemType;
    isOverlay?: boolean;
    isNearTarget?: boolean;
    isHoverTarget?: boolean;
    sortableEnabled?: boolean;

    // Interactions
    onClick?: (item: GridItemType, event?: React.MouseEvent) => void;
    onEdit?: (item: GridItemType) => void;
    onDeletePrompt?: (item: GridItemType) => void;
}

export function GridItem({
    item,
    isOverlay,
    isNearTarget,
    isHoverTarget,
    sortableEnabled = true,
    onClick,
    onEdit,
    onDeletePrompt
}: GridItemProps) {

    // ─── Widget path: kind='widget' OR folder 2x2 ──────────────────
    if (item.kind === "widget") {
        const resolvedPreset = resolveGridPreset(item);
        const preset = resolvedPreset === "custom" ? "2x2" : resolvedPreset;
        const fallbackSize = GRID_ITEM_PRESETS[preset];
        const gridSize = {
            w: typeof item.w === "number" ? item.w : fallbackSize.w,
            h: typeof item.h === "number" ? item.h : fallbackSize.h,
        };

        return (
            <LauncherWidgetRenderer
                item={item as LauncherWidgetItem}
                preset={preset}
                gridSize={gridSize}
                className="h-full w-full"
                onActivate={(e) => onClick && onClick(item, e)}
                onEdit={(target) => onEdit?.(target)}
                onDeletePrompt={(target) => onDeletePrompt?.(target)}
                isOverlay={isOverlay}
            />
        );
    }

    // ─── App path: tag / system app / folder 1x1 ───────────────────
    if (item.kind === "app") {
        return (
            <SystemAppTile
                item={item}
                onClick={onClick}
                onEdit={onEdit}
                onDeletePrompt={onDeletePrompt}
                isOverlay={isOverlay}
                isNearTarget={isNearTarget}
                isHoverTarget={isHoverTarget}
                sortableEnabled={sortableEnabled}
            />
        );
    }

    if (item.kind === "folder") {
        return (
            <FolderAppTile
                item={item as FolderItemType}
                onClick={onClick}
                onEdit={onEdit}
                onDeletePrompt={onDeletePrompt}
                isOverlay={isOverlay}
                isNearTarget={isNearTarget}
                isHoverTarget={isHoverTarget}
                sortableEnabled={sortableEnabled}
            />
        );
    }

    // Default: Web Tag
    return (
        <TagAppTile
            item={item as WebTagItem}
            onClick={onClick}
            onEdit={onEdit}
            onDeletePrompt={onDeletePrompt}
            isOverlay={isOverlay}
            isNearTarget={isNearTarget}
            isHoverTarget={isHoverTarget}
            sortableEnabled={sortableEnabled}
        />
    );
}

// ─── App-path thin wrappers (adapter → icon-system-v1) ──────────────

interface AppPathProps {
    onClick?: (item: GridItemType, event?: React.MouseEvent) => void;
    onEdit?: (item: GridItemType) => void;
    onDeletePrompt?: (item: GridItemType) => void;
    isOverlay?: boolean;
    isNearTarget?: boolean;
    isHoverTarget?: boolean;
    sortableEnabled?: boolean;
}

function SystemAppTile({ item, onClick, onEdit, onDeletePrompt, ...rest }: AppPathProps & { item: GridItemType & { kind: "app" } }) {
    const { t } = useTranslation();
    const displayTitle = item.title?.startsWith("sys_") ? t(item.title) : item.title;
    const iconSeed = resolveSystemAppIconSeedV1(item, { translateTitle: t });

    const handlePrefetch = () => {
        if (!isSystemAppId(item.appId)) return;
        preloadModalRuntime(item.appId);
    };

    return (
        <DesktopIconTileV1
            id={item.id}
            displayTitle={displayTitle}
            iconSeed={iconSeed}
            onClick={(e) => onClick?.(item, e as React.MouseEvent | undefined)}
            onEdit={() => onEdit?.(item)}
            onDelete={() => onDeletePrompt?.(item)}
            onPrefetch={handlePrefetch}
            {...rest}
        />
    );
}

function TagAppTile({ item, onClick, onEdit, onDeletePrompt, ...rest }: AppPathProps & { item: WebTagItem }) {
    const iconSeed = resolveTagIconSeedV1(item);

    return (
        <DesktopIconTileV1
            id={item.id}
            displayTitle={item.title}
            iconSeed={iconSeed}
            onClick={(e) => {
                if (onClick) {
                    onClick(item, e as React.MouseEvent | undefined);
                } else if (item.url) {
                    window.open(item.url, "_blank");
                }
            }}
            onEdit={() => onEdit?.(item)}
            onDelete={() => onDeletePrompt?.(item)}
            {...rest}
        />
    );
}

function FolderAppTile({ item, onClick, onEdit, onDeletePrompt, ...rest }: AppPathProps & { item: FolderItemType }) {
    const { t } = useTranslation();
    const { updateItem } = useItemStore();
    const layout = item.displayMode === "2x2" ? "expanded" : "compact";
    const iconSeeds = resolveFolderChildIconSeedsV1(item, layout, { translateTitle: t });
    const extraMenuItems = item.displayMode === "2x2"
        ? [{
            label: t("folder_switch_1x1"),
            icon: <Minimize2 size={12} />,
            onClick: () => updateItem(item.id, { displayMode: "1x1", w: 1, h: 1 } as Partial<GridItemType>),
        }]
        : [{
            label: t("folder_switch_2x2"),
            icon: <Maximize2 size={12} />,
            onClick: () => updateItem(item.id, { displayMode: "2x2", w: 2, h: 2 } as Partial<GridItemType>),
        }];

    return (
        <DesktopFolderTileV1
            id={item.id}
            displayTitle={item.title}
            iconSeeds={iconSeeds}
            layout={layout}
            extraMenuItems={extraMenuItems}
            onClick={(e) => onClick?.(item, e as React.MouseEvent | undefined)}
            onEdit={() => onEdit?.(item)}
            onDelete={() => onDeletePrompt?.(item)}
            {...rest}
        />
    );
}

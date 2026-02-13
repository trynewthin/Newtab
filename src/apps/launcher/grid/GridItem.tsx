import type {
    GridItem as GridItemType,
    WebTagItem,
    FolderItem as FolderItemType,
    LauncherWidgetItem,
} from "@/state/core/itemTypes";
import { isSystemAppId } from "@/apps/launcher/system/appManifest";
import { preloadModalRuntime } from "@/apps/launcher/system/appRuntimeRegistry";
import { LauncherWidgetItem as LauncherWidgetRenderer } from "@/apps/launcher/widget";
import { GRID_ITEM_PRESETS, resolveGridPreset } from "@/apps/launcher/grid/layoutPresets";
import { AppTile } from "@/apps/launcher/base/AppTile";
import { useSystemAppIconDescriptor, useTagIconDescriptor, useFolderIconDescriptor } from "@/apps/launcher/base/adapters";
import { FolderWidget } from "@/apps/launcher/folder/FolderWidget";
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

    if (item.kind === "folder" && item.displayMode === "2x2") {
        return (
            <FolderWidget
                item={item as FolderItemType}
                onEdit={onEdit as (item: FolderItemType) => void}
                onDeletePrompt={onDeletePrompt as (item: GridItemType) => void}
                onClick={onClick as (item: GridItemType) => void}
                isOverlay={isOverlay}
                sortableEnabled={sortableEnabled}
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

// ─── App-path thin wrappers (adapter → AppTile) ─────────────────────

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
    const iconDescriptor = useSystemAppIconDescriptor(item.title, item.icon || "");

    const handlePrefetch = () => {
        if (!isSystemAppId(item.appId)) return;
        preloadModalRuntime(item.appId);
    };

    return (
        <AppTile
            id={item.id}
            displayTitle={displayTitle}
            iconDescriptor={iconDescriptor}
            onClick={(e) => onClick?.(item, e as React.MouseEvent | undefined)}
            onEdit={() => onEdit?.(item)}
            onDelete={() => onDeletePrompt?.(item)}
            onPrefetch={handlePrefetch}
            {...rest}
        />
    );
}

function TagAppTile({ item, onClick, onEdit, onDeletePrompt, ...rest }: AppPathProps & { item: WebTagItem }) {
    const iconDescriptor = useTagIconDescriptor(item);

    return (
        <AppTile
            id={item.id}
            displayTitle={item.title}
            iconDescriptor={iconDescriptor}
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
    const { iconDescriptor, extraMenuItems } = useFolderIconDescriptor(item);

    return (
        <AppTile
            id={item.id}
            displayTitle={item.title}
            iconDescriptor={iconDescriptor}
            extraMenuItems={extraMenuItems}
            onClick={(e) => onClick?.(item, e as React.MouseEvent | undefined)}
            onEdit={() => onEdit?.(item)}
            onDelete={() => onDeletePrompt?.(item)}
            {...rest}
        />
    );
}

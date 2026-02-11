import type {
    GridItem as GridItemType,
    WebTagItem,
    FolderItem as FolderItemType,
    LauncherWidgetItem,
} from "@/platform/state/core/itemTypes";
import { TagItem } from "@/apps/launcher/tag/TagItem";
import { FolderItem } from "@/apps/launcher/folder/FolderItem";
import { SystemAppItem } from "@/apps/launcher/system/SystemAppItem";
import { isSystemAppId } from "@/apps/launcher/system/appManifest";
import { preloadModalRuntime } from "@/apps/launcher/system/appRuntimeRegistry";
import { LauncherWidgetItem as LauncherWidgetRenderer } from "@/apps/launcher/widget";
import { GRID_ITEM_PRESETS, resolveGridPreset } from "@/apps/launcher/grid/layoutPresets";

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

    // 1. System App
    if (item.kind === 'app') {
        const handlePrefetch = () => {
            if (!isSystemAppId(item.appId)) return;
            preloadModalRuntime(item.appId);
        };

        return (
            <SystemAppItem
                id={item.id}
                title={item.title}
                icon={item.icon || ''}
                onClick={(e) => onClick && onClick(item, e)}
                onEdit={() => onEdit?.(item)}
                onDelete={() => onDeletePrompt?.(item)}
                onPrefetch={handlePrefetch}
                isOverlay={isOverlay}
                isNearTarget={isNearTarget}
                isHoverTarget={isHoverTarget}
                sortableEnabled={sortableEnabled}
                className="w-full"
            />
        );
    }

    // 2. Widget
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

    // 3. Folder
    if (item.kind === 'folder') {
        return (
            <FolderItem
                item={item as FolderItemType}
                onEdit={onEdit as any} // onEdit usually handles editing item details
                onClick={onClick as any}
                onDeletePrompt={onDeletePrompt as any}
                isOverlay={isOverlay}
                isNearTarget={isNearTarget}
                isHoverTarget={isHoverTarget}
                sortableEnabled={sortableEnabled}
            />
        );
    }

    // 4. Web Tag (Default)
    return (
        <TagItem
            item={item as WebTagItem}
            onEdit={onEdit as any}
            onClick={onClick as any}
            onDeletePrompt={onDeletePrompt as any}
            isOverlay={isOverlay}
            isNearTarget={isNearTarget}
            isHoverTarget={isHoverTarget}
            sortableEnabled={sortableEnabled}
        />
    );
}


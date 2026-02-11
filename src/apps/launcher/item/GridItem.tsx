import type { GridItem as GridItemType, WebTagItem, FolderItem as FolderItemType } from "@/platform/state/core/itemTypes";
import { TagItem } from "@/apps/launcher/tag/TagItem";
import { FolderItem } from "@/apps/launcher/folder/FolderItem";
import { SystemAppItem } from "@/apps/launcher/system/SystemAppItem";
import { isSystemAppId } from "@/apps/launcher/system/appManifest";
import { preloadModalRuntime } from "@/apps/launcher/system/appRuntimeRegistry";

interface GridItemProps {
    item: GridItemType;
    isOverlay?: boolean;
    isNearTarget?: boolean;
    isHoverTarget?: boolean;

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
                onPrefetch={handlePrefetch}
                isOverlay={isOverlay}
                isNearTarget={isNearTarget}
                isHoverTarget={isHoverTarget}
                className="w-full"
            />
        );
    }

    // 2. Folder
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
            />
        );
    }

    // 3. Web Tag (Default)
    return (
        <TagItem
            item={item as WebTagItem}
            onEdit={onEdit as any}
            onClick={onClick as any}
            onDeletePrompt={onDeletePrompt as any}
            isOverlay={isOverlay}
            isNearTarget={isNearTarget}
            isHoverTarget={isHoverTarget}
        />
    );
}


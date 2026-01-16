import type { GridItem as GridItemType, WebTagItem, FolderItem as FolderItemType } from "@/store/core/itemTypes";
import { TagItem } from "@/apps/core/tag/TagItem";
import { FolderItem } from "@/apps/core/folder/FolderItem";
import { SystemAppItem } from "@/apps/core/system/SystemAppItem";
import { getAppIconComponent } from "@/apps/registry";

interface GridItemProps {
    item: GridItemType;
    isOverlay?: boolean;
    isNearTarget?: boolean;
    isHoverTarget?: boolean;

    // Interactions
    onClick?: (item: GridItemType) => void;
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
        const AppComponent = getAppIconComponent(item.appId);

        if (AppComponent) {
            return (
                <AppComponent
                    id={item.id}
                    title={item.title}
                    icon={item.icon || ''}
                    isOverlay={isOverlay}
                    isNearTarget={isNearTarget}
                    isHoverTarget={isHoverTarget}
                    className="w-full"
                />
            );
        }

        return (
            <SystemAppItem
                id={item.id}
                title={item.title}
                icon={item.icon || ''}
                onClick={() => onClick && onClick(item)}
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

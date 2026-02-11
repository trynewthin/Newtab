import type { GridItem as GridItemType } from "@/platform/state/core/itemTypes";
import { GridItem } from "@/apps/launcher/item/GridItem";
import { getItemLayoutCapability } from "../layoutPresets";
import { IconGridTile } from "./IconGridTile";
import { PanelGridTile } from "./PanelGridTile";

interface LauncherGridItemSurfaceProps {
    item: GridItemType;
    isEditing: boolean;
    onClick: (item: GridItemType, event?: React.MouseEvent) => void;
    onEdit: (item: GridItemType) => void;
    onDeletePrompt: (item: GridItemType) => void;
}

// 统一入口：根据尺寸预设选择 item 变体（icon/panel...）。
export function LauncherGridItemSurface({
    item,
    isEditing,
    onClick,
    onEdit,
    onDeletePrompt,
}: LauncherGridItemSurfaceProps) {
    const capability = getItemLayoutCapability(item);

    const content = (
        <GridItem
            item={item}
            onClick={onClick}
            onEdit={onEdit}
            onDeletePrompt={onDeletePrompt}
            sortableEnabled={false}
        />
    );

    if (capability.variant === "icon") {
        return <IconGridTile isEditing={isEditing}>{content}</IconGridTile>;
    }

    return <PanelGridTile isEditing={isEditing}>{content}</PanelGridTile>;
}

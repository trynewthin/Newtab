import type { GridItem as GridItemType } from "@/state/core/itemTypes";
import { GridItem } from "@/apps/launcher/grid/GridItem";
import { getItemLayoutCapability } from "../layoutPresets";
import { IconGridTile } from "./IconGridTile";
import { PanelGridTile } from "./PanelGridTile";

interface LauncherGridItemSurfaceProps {
    item: GridItemType;
    isEditing: boolean;
    isHoverTarget?: boolean;
    onClick: (item: GridItemType, event?: React.MouseEvent) => void;
    onEdit: (item: GridItemType) => void;
    onDeletePrompt: (item: GridItemType) => void;
}

// 统一入口：根据尺寸预设选择 item 变体（icon/panel...）。
export function LauncherGridItemSurface({
    item,
    isEditing,
    isHoverTarget,
    onClick,
    onEdit,
    onDeletePrompt,
}: LauncherGridItemSurfaceProps) {
    const capability = getItemLayoutCapability(item);

    const content = (
        <GridItem
            item={item}
            isHoverTarget={isHoverTarget}
            onClick={onClick}
            onEdit={onEdit}
            onDeletePrompt={onDeletePrompt}
            sortableEnabled={false}
        />
    );

    if (capability.variant === "icon") {
        return <IconGridTile isEditing={isEditing} isHoverTarget={isHoverTarget}>{content}</IconGridTile>;
    }

    return <PanelGridTile isEditing={isEditing} isHoverTarget={isHoverTarget}>{content}</PanelGridTile>;
}

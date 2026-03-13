import { useTranslation } from "react-i18next";
import { cn } from "@/shared/utils";
import { ItemActionMenu } from "@/launcher/ui/components/ItemActionMenu";
import type { LauncherWidgetItem as LauncherWidgetRecord } from "@/launcher/model/itemTypes";
import type { LauncherTilePreset } from "@/shared/types";
import { getWidgetManifestItem } from "@/launcher/registry";
import { AppShortcutWidgetRenderer } from "./widgetFrames";

interface LauncherWidgetItemProps {
    item: LauncherWidgetRecord;
    preset: LauncherTilePreset;
    gridSize: { w: number; h: number };
    className?: string;
    onActivate?: (event?: React.MouseEvent) => void;
    onEdit?: (item: LauncherWidgetRecord) => void;
    onDeletePrompt?: (item: LauncherWidgetRecord) => void;
    isOverlay?: boolean;
}

export function LauncherWidgetItem({
    item,
    preset,
    gridSize,
    className,
    onActivate,
    onEdit,
    onDeletePrompt,
    isOverlay,
}: LauncherWidgetItemProps) {
    const { t } = useTranslation();
    const widget = getWidgetManifestItem(item.widgetId);
    const Renderer = widget?.renderer ?? AppShortcutWidgetRenderer;

    return (
        <div className={cn("group relative h-full w-full", className)}>
            <ItemActionMenu
                disabled={!!isOverlay}
                onEdit={() => onEdit?.(item)}
                onDelete={() => onDeletePrompt?.(item)}
                editLabel={t("edit")}
                deleteLabel={t("remove")}
            >
                <Renderer
                    item={item}
                    preset={preset}
                    gridSize={gridSize}
                    className="h-full w-full"
                    onActivate={onActivate}
                />
            </ItemActionMenu>
        </div>
    );
}

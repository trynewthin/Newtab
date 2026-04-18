import { cn } from "@/shared/utils";
import type { LauncherWidgetItem as LauncherWidgetRecord } from "@/launcher/model/itemTypes";
import type { LauncherTilePreset } from "@/shared/types";
import { getWidgetManifestItem } from "@/launcher/registry";
import { AppShortcutWidgetRenderer } from "./widgetFrames";

interface LauncherWidgetContentProps {
    item: LauncherWidgetRecord;
    preset: LauncherTilePreset;
    gridSize: { w: number; h: number };
    className?: string;
    onActivate?: (event?: React.MouseEvent) => void;
}

export function LauncherWidgetContent({
    item,
    preset,
    gridSize,
    className,
    onActivate,
}: LauncherWidgetContentProps) {
    const widget = getWidgetManifestItem(item.widgetId);
    const Renderer = widget?.renderer ?? AppShortcutWidgetRenderer;

    return (
        <Renderer
            item={item}
            preset={preset}
            gridSize={gridSize}
            className={cn("h-full w-full", className)}
            onActivate={onActivate}
        />
    );
}

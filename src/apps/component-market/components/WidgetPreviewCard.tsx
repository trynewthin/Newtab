import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import { cn } from "@/core/utils";
import { GRID_ITEM_PRESETS, type GridPresetKey } from "@/shell/launcher/layout/layoutPresets";
import type { SystemWidgetManifestItem } from "@/shell/launcher/registry";
import type { LauncherWidgetItem } from "@/state/core/itemTypes";

interface WidgetPreviewCardProps {
    widget: SystemWidgetManifestItem;
    onAdd: (widget: SystemWidgetManifestItem, preset: GridPresetKey) => void;
}

export function WidgetPreviewCard({ widget, onAdd }: WidgetPreviewCardProps) {
    const { t } = useTranslation();
    const Renderer = widget.renderer;
    const preset = widget.defaultPreset as GridPresetKey;
    const size = GRID_ITEM_PRESETS[preset];
    const fakeItem: LauncherWidgetItem = {
        id: `preview-${widget.id}`,
        kind: "widget",
        widgetId: widget.id,
        ownerAppId: widget.ownerAppId,
        title: widget.title,
        icon: widget.icon,
    };

    // col-span maps: 1→1, 2→2, 4→4 etc.
    const colSpanClass =
        size.w >= 4 ? "col-span-4"
        : size.w >= 2 ? "col-span-2"
        : "";
    const rowSpanClass = size.h >= 2 ? "row-span-2" : "";

    return (
        <div
            className={cn(
                "group/widget relative",
                colSpanClass,
                rowSpanClass,
            )}
        >
            <div
                className="relative overflow-hidden rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.12),0_2px_6px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_12px_rgba(255,255,255,0.08),0_2px_6px_rgba(255,255,255,0.05)]"
                style={{ aspectRatio: `${size.w} / ${size.h}` }}
            >
                <Renderer
                    item={fakeItem}
                    preset={preset}
                    gridSize={size}
                    className="relative h-full w-full"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-end p-2 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover/widget:opacity-100 transition-opacity">
                    <button
                        onClick={() => onAdd(widget, preset)}
                        className="flex items-center gap-1.5 rounded-xl bg-white/90 px-3 py-1.5 text-[11px] font-bold text-black shadow-lg backdrop-blur-sm transition-transform active:scale-95"
                    >
                        <Plus size={12} strokeWidth={3} />
                        {t("add")}
                    </button>
                </div>
            </div>
            <div className="mt-1.5 px-0.5">
                <div className="truncate text-xs font-medium text-foreground/80">{t(widget.title)}</div>
                <div className="text-[10px] text-foreground/40">{preset}</div>
            </div>
        </div>
    );
}

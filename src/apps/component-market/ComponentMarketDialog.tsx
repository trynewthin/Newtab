import { useMemo } from "react";
import { AppSurfaceModal } from "@/platform/shared/components";
import { Button } from "@/platform/shared/ui/button";
import { useItemStore } from "@/apps/launcher/store/item";
import {
    type AppSurfaceFramePreset,
    ENABLED_SYSTEM_APP_MANIFEST,
    getAppManifestItem,
    type LauncherTilePreset,
    type SystemAppManifestItem,
} from "@/apps/launcher/system/appManifest";
import { GRID_ITEM_PRESETS } from "@/apps/launcher/grid/layoutPresets";
import { renderSystemIcon } from "@/apps/launcher/system/systemIcons";
import {
    SYSTEM_WIDGET_MANIFEST,
    type SystemWidgetManifestItem,
} from "@/apps/launcher/widget";
import { Plus, Square, RectangleHorizontal, RectangleVertical } from "lucide-react";

interface ComponentMarketDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    framePreset?: AppSurfaceFramePreset;
}

const PRESET_ORDER: readonly LauncherTilePreset[] = ["1x1", "2x1", "1x2", "2x2", "2x4"] as const;

function getPresetSize(preset: LauncherTilePreset) {
    return GRID_ITEM_PRESETS[preset];
}

function getSurfaceLabel(app: SystemAppManifestItem): string {
    const labels: string[] = [];
    if (app.surfaces.modal) labels.push("Modal");
    if (app.surfaces.page) labels.push("Page");
    return labels.join(" / ");
}

function renderPresetGlyph(preset: LauncherTilePreset) {
    if (preset === "2x1") return <RectangleHorizontal className="h-3.5 w-3.5" />;
    if (preset === "1x2") return <RectangleVertical className="h-3.5 w-3.5" />;
    return <Square className="h-3.5 w-3.5" />;
}

export function ComponentMarketDialog({ open, onOpenChange, framePreset = "semi" }: ComponentMarketDialogProps) {
    const { addItem } = useItemStore();

    const apps = useMemo<SystemAppManifestItem[]>(() => [...ENABLED_SYSTEM_APP_MANIFEST], []);
    const widgets = useMemo<SystemWidgetManifestItem[]>(() => [...SYSTEM_WIDGET_MANIFEST], []);

    const handleAddIcon = (app: SystemAppManifestItem) => {
        const size = getPresetSize("1x1");
        addItem({
            appId: app.id,
            title: app.title,
            icon: app.icon,
            w: size.w,
            h: size.h,
        });
    };

    const handleAddWidget = (widget: SystemWidgetManifestItem, preset: LauncherTilePreset) => {
        const size = getPresetSize(preset);
        addItem({
            widgetId: widget.id,
            ownerAppId: widget.ownerAppId,
            title: widget.title,
            icon: widget.icon,
            w: size.w,
            h: size.h,
        });
    };

    const content = (
        <div className="mx-auto h-[min(76vh,calc(100dvh-7rem))] w-full max-w-5xl overflow-y-auto px-4 py-4 custom-scrollbar sm:px-5 sm:py-5">
            <div className="space-y-5">
                <section className="space-y-2.5">
                    <div className="px-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                        App Icons
                    </div>
                    <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-3">
                        {apps.map((app) => (
                            <div
                                key={app.id}
                                className="modal-minimal-card"
                            >
                                <div className="space-y-3">
                                    <div className="flex min-w-0 items-center gap-3">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/70 bg-background text-foreground shadow-xs">
                                            {renderSystemIcon(app.icon, "h-5 w-5")}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="truncate text-sm font-semibold tracking-tight text-foreground">
                                                {app.title}
                                            </div>
                                            <div className="text-[11px] text-muted-foreground">
                                                {getSurfaceLabel(app)}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleAddIcon(app)}
                                        >
                                            <Plus className="h-3.5 w-3.5" />
                                            Icon 1x1
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="space-y-2.5">
                    <div className="px-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                        Components
                    </div>
                    <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-3">
                        {widgets.map((widget) => {
                            const owner = widget.ownerAppId ? getAppManifestItem(widget.ownerAppId) : null;
                            return (
                                <div
                                    key={widget.id}
                                    className="modal-minimal-card"
                                >
                                    <div className="space-y-3">
                                        <div className="flex min-w-0 items-center gap-3">
                                            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/70 bg-background text-foreground shadow-xs">
                                                {renderSystemIcon(widget.icon, "h-5 w-5")}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="truncate text-sm font-semibold tracking-tight text-foreground">
                                                    {widget.title}
                                                </div>
                                                <div className="text-[11px] text-muted-foreground">
                                                    {owner ? `Owner: ${owner.title}` : "Standalone Component"}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2">
                                            {PRESET_ORDER.filter((preset) =>
                                                (widget.supportedPresets as readonly LauncherTilePreset[]).includes(preset)
                                            ).map((preset) => (
                                                <Button
                                                    key={`${widget.id}-${preset}`}
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => handleAddWidget(widget, preset)}
                                                >
                                                    {renderPresetGlyph(preset)}
                                                    {preset}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            </div>
        </div>
    );

    return (
        <AppSurfaceModal
            open={open}
            onOpenChange={onOpenChange}
            preset={framePreset}
            title="Component Market"
            content={content}
            background={<div className="absolute inset-0 bg-background" />}
        />
    );
}

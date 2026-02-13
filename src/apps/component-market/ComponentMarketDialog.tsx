import { useTranslation } from "react-i18next";
import { useItemStore } from "@/apps/launcher/store/item";
import { AppSurfaceModal } from "@/platform/shared/components/modal/AppSurfaceModal";
import { renderSystemIcon } from "@/apps/launcher/system/systemIcons";
import {
    ENABLED_SYSTEM_APP_MANIFEST,
    type SystemAppManifestItem,
} from "@/apps/launcher/system/appManifest";
import {
    SYSTEM_WIDGET_MANIFEST,
    getWidgetCollections,
    getWidgetsByCollection,
    type SystemWidgetManifestItem,
} from "@/apps/launcher/widget";
import { GRID_ITEM_PRESETS, type GridPresetKey } from "@/apps/launcher/grid/layoutPresets";
import { Plus } from "lucide-react";

interface ComponentMarketDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ComponentMarketDialog({ open, onOpenChange }: ComponentMarketDialogProps) {
    const { t } = useTranslation();
    const { addItem } = useItemStore();

    const handleAddAppIcon = (app: SystemAppManifestItem) => {
        addItem({
            title: app.title,
            appId: app.id,
            icon: app.icon,
        } as any);
        onOpenChange(false);
    };

    const handleAddWidget = (widget: SystemWidgetManifestItem, preset: GridPresetKey) => {
        const size = GRID_ITEM_PRESETS[preset];
        addItem({
            title: widget.title,
            widgetId: widget.id,
            ownerAppId: widget.ownerAppId,
            icon: widget.icon,
            w: size.w,
            h: size.h,
        } as any);
        onOpenChange(false);
    };

    // Group apps by category
    const appsByCategory = new Map<string, SystemAppManifestItem[]>();
    for (const app of ENABLED_SYSTEM_APP_MANIFEST) {
        const cat = (app as SystemAppManifestItem).category ?? "other";
        if (!appsByCategory.has(cat)) appsByCategory.set(cat, []);
        appsByCategory.get(cat)!.push(app);
    }

    // Widget collections
    const collections = getWidgetCollections();

    // Standalone widgets (no collection)
    const standaloneWidgets = (SYSTEM_WIDGET_MANIFEST as readonly SystemWidgetManifestItem[]).filter(
        (w) => !(w as SystemWidgetManifestItem).collection
    );

    const marketContent = (
        <div className="h-[60vh] overflow-y-auto custom-scrollbar space-y-6 p-4">
            {/* App Icons by Category */}
            <section>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground/50 mb-3">
                    {t("component_market_app_icons")}
                </h3>
                {[...appsByCategory.entries()].map(([category, apps]) => (
                    <div key={category} className="mb-4">
                        <h4 className="text-[11px] font-medium text-foreground/40 mb-2">
                            {t(`category_${category}`)}
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {apps.map((app) => (
                                <button
                                    key={app.id}
                                    onClick={() => handleAddAppIcon(app)}
                                    className="flex items-center gap-2.5 rounded-lg border border-border/50 p-2.5 text-left transition-colors hover:bg-accent/50"
                                >
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-foreground/5 text-foreground/70">
                                        {renderSystemIcon(app.icon, "h-4 w-4")}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="truncate text-sm font-medium">{t(app.title)}</div>
                                    </div>
                                    <Plus size={14} className="shrink-0 text-foreground/30" />
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </section>

            {/* Widgets by Collection */}
            <section>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground/50 mb-3">
                    {t("component_market_components")}
                </h3>
                {collections.map((collection) => {
                    const widgets = getWidgetsByCollection(collection);
                    return (
                        <div key={collection} className="mb-4">
                            <h4 className="text-[11px] font-medium text-foreground/40 mb-2">
                                {t(`collection_${collection}`)}
                            </h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {widgets.map((widget) => (
                                    <button
                                        key={widget.id}
                                        onClick={() => handleAddWidget(widget, widget.defaultPreset as GridPresetKey)}
                                        className="flex items-center gap-2.5 rounded-lg border border-border/50 p-2.5 text-left transition-colors hover:bg-accent/50"
                                    >
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-foreground/5 text-foreground/70">
                                            {renderSystemIcon(widget.icon, "h-4 w-4")}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="truncate text-sm font-medium">{t(widget.title)}</div>
                                            <div className="text-[10px] text-foreground/40">{widget.defaultPreset}</div>
                                        </div>
                                        <Plus size={14} className="shrink-0 text-foreground/30" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    );
                })}

                {/* Standalone widgets */}
                {standaloneWidgets.length > 0 && (
                    <div className="mb-4">
                        <h4 className="text-[11px] font-medium text-foreground/40 mb-2">
                            {t("component_market_standalone")}
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {standaloneWidgets.map((widget) => (
                                <button
                                    key={widget.id}
                                    onClick={() => handleAddWidget(widget, widget.defaultPreset as GridPresetKey)}
                                    className="flex items-center gap-2.5 rounded-lg border border-border/50 p-2.5 text-left transition-colors hover:bg-accent/50"
                                >
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-foreground/5 text-foreground/70">
                                        {renderSystemIcon(widget.icon, "h-4 w-4")}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="truncate text-sm font-medium">{t(widget.title)}</div>
                                        <div className="text-[10px] text-foreground/40">{widget.defaultPreset}</div>
                                    </div>
                                    <Plus size={14} className="shrink-0 text-foreground/30" />
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </section>
        </div>
    );

    return (
        <AppSurfaceModal
            open={open}
            onOpenChange={onOpenChange}
            title={t("component_market_title")}
            preset="semi"
            content={marketContent}
        />
    );
}

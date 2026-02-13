import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useItemStore } from "@/apps/launcher/store/item";
import { AppSurfaceModal } from "@/components/modal/AppSurfaceModal";
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
import type { LauncherWidgetItem } from "@/state/core/itemTypes";
import { Plus, Minus, Check, AppWindow, Puzzle } from "lucide-react";
import { cn } from "@/core/utils";
import { ModalTabs } from "@/components/modal";
import GradualBlur from "@/components/GradualBlur";

type MarketTab = "icons" | "widgets";

interface ComponentMarketDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ComponentMarketDialog({ open, onOpenChange }: ComponentMarketDialogProps) {
    const { t } = useTranslation();
    const { items, addItem, removeItem } = useItemStore();

    const addedAppIds = new Set(
        items
            .filter((item): item is import("@/state/core/itemTypes").SystemAppItem => item.kind === "app")
            .map((item) => item.appId)
    );
    const [activeTab, setActiveTab] = useState<MarketTab>("icons");

    const handleToggleAppIcon = (app: SystemAppManifestItem) => {
        if (addedAppIds.has(app.id)) {
            const existing = items.find(
                (item) => item.kind === "app" && (item as import("@/state/core/itemTypes").SystemAppItem).appId === app.id
            );
            if (existing) removeItem(existing.id);
        } else {
            addItem({
                title: app.title,
                appId: app.id,
                icon: app.icon,
            } as any);
        }
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

    // ─── Tab switcher (placed in actions slot, left of close button) ───
    const tabSwitcher = (
        <ModalTabs
            items={[
                { id: "icons", icon: AppWindow, label: t("component_market_app_icons") },
                { id: "widgets", icon: Puzzle, label: t("component_market_components") },
            ]}
            activeId={activeTab}
            onActiveChange={(id) => setActiveTab(id as MarketTab)}
        />
    );

    // ─── Icons tab content ───────────────────────────────────────────
    const iconsContent = (
        <div className="space-y-4">
            {[...appsByCategory.entries()].map(([category, apps]) => (
                <div key={category}>
                    <h4 className="text-[11px] font-medium text-foreground/40 mb-2">
                        {t(`category_${category}`)}
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {apps.map((app) => {
                            const isAdded = addedAppIds.has(app.id);
                            return (
                                <button
                                    key={app.id}
                                    onClick={() => handleToggleAppIcon(app)}
                                    className={cn(
                                        "group flex items-center gap-2.5 rounded-lg border p-2.5 text-left transition-colors",
                                        isAdded
                                            ? "border-foreground/15 bg-foreground/5 hover:border-red-500/30 hover:bg-red-500/5"
                                            : "border-border/50 hover:bg-accent/50",
                                    )}
                                >
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-foreground/5 text-foreground/70">
                                        {renderSystemIcon(app.icon, "h-4 w-4")}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="truncate text-sm font-medium">{t(app.title)}</div>
                                    </div>
                                    {isAdded ? (
                                        <div className="shrink-0 text-foreground/50">
                                            <Check size={14} className="group-hover:hidden" />
                                            <Minus size={14} className="hidden group-hover:block text-red-500" />
                                        </div>
                                    ) : (
                                        <Plus size={14} className="shrink-0 text-foreground/30" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );

    // ─── Widget preview card ────────────────────────────────────────
    const renderWidgetPreview = (widget: SystemWidgetManifestItem) => {
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

        const isWide = size.w > size.h;
        const isTall = size.h > size.w;

        return (
            <div
                key={widget.id}
                className={cn(
                    "group/widget relative",
                    isWide && "col-span-2",
                    isTall && "row-span-2",
                )}
            >
                <div className={cn(
                    "relative overflow-hidden rounded-2xl",
                    size.w === 1 && size.h === 1 && "aspect-square",
                    isWide && "aspect-2/1",
                    isTall && "aspect-1/2",
                    size.w === 2 && size.h === 2 && "aspect-square",
                )}>
                    <div className="absolute inset-0 bg-linear-to-br from-indigo-950 via-slate-900 to-purple-950" />
                    <Renderer
                        item={fakeItem}
                        preset={preset}
                        gridSize={size}
                        className="relative h-full w-full"
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-end p-2 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover/widget:opacity-100 transition-opacity">
                        <button
                            onClick={() => handleAddWidget(widget, preset)}
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
    };

    // ─── Widgets tab content ─────────────────────────────────────────
    const widgetsContent = (
        <div className="space-y-6">
            {collections.map((collection) => {
                const widgets = getWidgetsByCollection(collection);
                return (
                    <div key={collection}>
                        <h4 className="text-[11px] font-medium text-foreground/40 mb-3">
                            {t(`collection_${collection}`)}
                        </h4>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                            {widgets.map(renderWidgetPreview)}
                        </div>
                    </div>
                );
            })}

            {standaloneWidgets.length > 0 && (
                <div>
                    <h4 className="text-[11px] font-medium text-foreground/40 mb-3">
                        {t("component_market_standalone")}
                    </h4>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                        {standaloneWidgets.map(renderWidgetPreview)}
                    </div>
                </div>
            )}
        </div>
    );

    const marketContent = (
        <div className="relative h-full">
            <GradualBlur position="top" height="3rem" strength={1.5} zIndex={10} />
            <GradualBlur position="bottom" height="3rem" strength={1.5} zIndex={10} />
            <div className="h-full overflow-y-auto custom-scrollbar px-4">
                <div className="h-14 shrink-0" />
                {activeTab === "icons" ? iconsContent : widgetsContent}
                <div className="h-8 shrink-0" />
            </div>
        </div>
    );

    return (
        <AppSurfaceModal
            open={open}
            onOpenChange={onOpenChange}
            title={t("component_market_title")}
            preset="semi"
            actions={tabSwitcher}
            content={marketContent}
        />
    );
}

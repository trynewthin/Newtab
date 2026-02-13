import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useItemStore } from "@/launcher/store/item";
import { renderSystemIcon } from "@/launcher/system/systemIcons";
import {
    ENABLED_SYSTEM_APP_MANIFEST,
    type SystemAppManifestItem,
} from "@/launcher/system/appManifest";
import {
    SYSTEM_WIDGET_MANIFEST,
    getWidgetCollections,
    getWidgetsByCollection,
    type SystemWidgetManifestItem,
} from "@/launcher/widget";
import { GRID_ITEM_PRESETS, type GridPresetKey } from "@/launcher/grid/layoutPresets";
import type { LauncherWidgetItem } from "@/state/core/itemTypes";
import { Plus, Minus, Check, AppWindow, Puzzle, X } from "lucide-react";
import { cn } from "@/core/utils";
import { Dialog } from "@base-ui/react/dialog";
import { LAYER_Z_INDEX } from "@/core/layerZIndex";
import AppSurface from "@/components/surface/AppSurface";

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

    // ─── Icons tab content ───────────────────────────────────────────
    const iconsContent = (
        <div className="space-y-5">
            {[...appsByCategory.entries()].map(([category, apps]) => (
                <div key={category}>
                    <h4 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2.5 px-0.5">
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
                                        "group flex items-center gap-2.5 rounded-xl p-2.5 text-left transition-all duration-200",
                                        isAdded
                                            ? "bg-secondary hover:bg-red-500/10"
                                            : "hover:bg-secondary",
                                    )}
                                >
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-secondary text-muted-foreground">
                                        {renderSystemIcon(app.icon, "h-4 w-4")}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="truncate text-[13px] font-medium text-foreground">{t(app.title)}</div>
                                    </div>
                                    {isAdded ? (
                                        <div className="shrink-0 text-muted-foreground">
                                            <Check size={14} strokeWidth={2.5} className="group-hover:hidden" />
                                            <Minus size={14} strokeWidth={2.5} className="hidden group-hover:block text-red-400" />
                                        </div>
                                    ) : (
                                        <Plus size={14} strokeWidth={2} className="shrink-0 text-muted-foreground/50" />
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
                        <h4 className="text-[10px] font-semibold uppercase tracking-widest text-foreground/30 mb-3 px-0.5">
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
                    <h4 className="text-[10px] font-semibold uppercase tracking-widest text-foreground/30 mb-3 px-0.5">
                        {t("component_market_standalone")}
                    </h4>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                        {standaloneWidgets.map(renderWidgetPreview)}
                    </div>
                </div>
            )}
        </div>
    );

    // ─── Tab pills ──────────────────────────────────────────────────
    const tabs: { id: MarketTab; icon: typeof AppWindow; label: string }[] = [
        { id: "icons", icon: AppWindow, label: t("component_market_app_icons") },
        { id: "widgets", icon: Puzzle, label: t("component_market_components") },
    ];

    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                {/* ── Backdrop: heavy blur + darker overlay ── */}
                <Dialog.Backdrop
                    style={{ zIndex: LAYER_Z_INDEX.overlayBackdrop }}
                    className={cn(
                        "fixed inset-0 bg-black/45 backdrop-blur-xl",
                        "data-open:animate-in data-closed:animate-out",
                        "data-open:fade-in-0 data-closed:fade-out-0",
                        "duration-300",
                    )}
                />

                {/* ── Popup: subtle scale + fade ── */}
                <Dialog.Popup
                    style={{ zIndex: LAYER_Z_INDEX.overlayContent }}
                    className={cn(
                        "fixed inset-0 outline-none",
                        "sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2",
                        "w-full h-full sm:w-[min(680px,80vw)] sm:h-[min(720px,80vh)]",
                        "sm:max-w-[calc(100vw-2rem)] sm:max-h-[calc(100vh-2rem)]",
                        "data-open:animate-in data-closed:animate-out",
                        "data-open:fade-in-0 data-closed:fade-out-0",
                        "data-open:zoom-in-[0.97] data-closed:zoom-out-[0.97]",
                        "duration-300 ease-out",
                    )}
                >
                    {/* ── Glass container ── */}
                    <div
                        className={cn(
                            "relative h-full w-full overflow-hidden isolate",
                            "sm:rounded-2xl",
                            "shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_2px_8px_rgba(0,0,0,0.12),0_12px_40px_rgba(0,0,0,0.24),0_32px_80px_rgba(0,0,0,0.18)]",
                        )}
                        style={{
                            // Reset text colors to dark-tone defaults so they stay readable
                            // on the opaque light background, regardless of wallpaper tone.
                            '--background': 'oklch(0.98 0.01 240)',
                            '--foreground': 'oklch(0.15 0.02 240)',
                            '--muted-foreground': 'oklch(0.45 0.02 240)',
                            '--secondary': 'oklch(0.95 0.01 240)',
                            '--accent-foreground': 'oklch(0.58 0.18 255)',
                            '--secondary-foreground': 'oklch(0.2 0.02 240)',
                            '--border': 'oklch(0.9 0.01 240)',
                        } as React.CSSProperties}
                    >
                        {/* Background layer */}
                        <div className="absolute inset-0 z-0 bg-background" />

                        {/* ── Floating header bar ── */}
                        <div className="absolute inset-x-0 top-0 z-30 pointer-events-none">
                            <div className="mx-3 mt-3 relative overflow-hidden rounded-xl pointer-events-auto shadow-md">
                                <div className="absolute inset-0 z-0">
                                    <AppSurface variant="toolbar" width="100%" height="100%" />
                                </div>
                                <div className="relative z-10 flex items-center justify-between gap-3 p-1.5">
                                {/* Tab switcher */}
                                <div className="flex items-center gap-0.5">
                                    {tabs.map((tab) => {
                                        const isActive = activeTab === tab.id;
                                        const Icon = tab.icon;
                                        return (
                                            <button
                                                key={tab.id}
                                                type="button"
                                                onClick={() => setActiveTab(tab.id)}
                                                className={cn(
                                                    "px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all duration-200 flex items-center gap-1.5",
                                                    isActive
                                                        ? "bg-foreground text-background shadow-sm"
                                                        : "text-muted-foreground hover:text-foreground hover:bg-secondary",
                                                )}
                                            >
                                                <Icon size={13} strokeWidth={isActive ? 2.5 : 2} />
                                                <span className="hidden sm:inline">{tab.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Close button */}
                                <Dialog.Close
                                    className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                                >
                                    <X size={14} strokeWidth={2.5} />
                                </Dialog.Close>
                                </div>
                            </div>
                        </div>

                        {/* ── Scroll content ── */}
                        <div className="relative z-10 h-full">
                            <div className="h-full overflow-y-auto custom-scrollbar px-5">
                                <div className="h-16 shrink-0" />
                                {activeTab === "icons" ? iconsContent : widgetsContent}
                                <div className="h-10 shrink-0" />
                            </div>
                        </div>
                    </div>
                </Dialog.Popup>
            </Dialog.Portal>
        </Dialog.Root>
    );
}

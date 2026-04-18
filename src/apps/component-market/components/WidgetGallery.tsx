import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
    ENABLED_SYSTEM_APP_MANIFEST,
    SYSTEM_WIDGET_MANIFEST,
    getWidgetCollections,
    getWidgetsByCollection,
    type SystemAppManifestItem,
    type SystemWidgetManifestItem,
} from "@/launcher/registry";
import { type GridPresetKey } from "@/launcher/layout";
import { AppModalEmptyState } from "@/platform/ui";
import { WidgetPreviewCard } from "./WidgetPreviewCard";
import { WidgetPreviewStage } from "./WidgetPreviewStage";

interface WidgetGalleryProps {
    onAddItem: (item: ComponentMarketItem, preset: GridPresetKey) => void;
}

interface BaseComponentMarketItem {
    id: string;
    title: string;
    supportedPresets: readonly GridPresetKey[];
    defaultPreset: GridPresetKey;
    sectionId: string;
    sectionLabelKey: string;
}

export interface ComponentMarketWidgetItem extends BaseComponentMarketItem {
    kind: "widget";
    item: SystemWidgetManifestItem;
}

export interface ComponentMarketAppItem extends BaseComponentMarketItem {
    kind: "app";
    item: SystemAppManifestItem;
}

export type ComponentMarketItem = ComponentMarketWidgetItem | ComponentMarketAppItem;

interface ComponentMarketSection {
    id: string;
    labelKey: string;
    items: ComponentMarketItem[];
}

export function WidgetGallery({ onAddItem }: WidgetGalleryProps) {
    const { t } = useTranslation();
    const [searchQuery, setSearchQuery] = useState("");

    const sections = useMemo<ComponentMarketSection[]>(() => {
        const widgetSections = getWidgetCollections().map((collection) => ({
            id: `collection:${collection}`,
            labelKey: `collection_${collection}`,
            items: getWidgetsByCollection(collection).map(toWidgetMarketItem),
        }));
        const standaloneWidgets = (SYSTEM_WIDGET_MANIFEST as readonly SystemWidgetManifestItem[])
            .filter((widget) => !widget.collection)
            .map(toWidgetMarketItem);
        const appSections = groupAppsByCategory(ENABLED_SYSTEM_APP_MANIFEST).map(([category, apps]) => ({
            id: `category:${category}`,
            labelKey: `category_${category}`,
            items: apps.map(toAppMarketItem),
        }));

        return [
            ...widgetSections,
            ...(standaloneWidgets.length > 0
                ? [{
                    id: "standalone",
                    labelKey: "component_market_standalone",
                    items: standaloneWidgets,
                }]
                : []),
            ...appSections,
        ];
    }, []);
    const allItems = useMemo(
        () => sections.flatMap((section) => section.items),
        [sections]
    );

    const [selectedWidgetId, setSelectedWidgetId] = useState<string>(allItems[0]?.id ?? "");
    const [selectedPreset, setSelectedPreset] = useState<GridPresetKey>(
        (allItems[0]?.defaultPreset as GridPresetKey | undefined) ?? "2x2"
    );

    const normalizedQuery = searchQuery.trim().toLowerCase();

    const matchesItem = (item: ComponentMarketItem) => {
        if (!normalizedQuery) {
            return true;
        }

        const translatedTitle = t(item.title).toLowerCase();
        return (
            translatedTitle.includes(normalizedQuery) ||
            item.id.toLowerCase().includes(normalizedQuery)
        );
    };

    const filteredSections = sections
        .map((section) => ({
            ...section,
            items: section.items.filter(matchesItem),
        }))
        .filter((section) => section.items.length > 0);

    const visibleItems = filteredSections.flatMap((section) => section.items);

    const selectedWidget =
        allItems.find((item) => item.id === selectedWidgetId) ??
        allItems[0] ??
        null;
    const previewWidget =
        visibleItems.find((item) => item.id === selectedWidgetId) ??
        visibleItems[0] ??
        selectedWidget;
    const resolvedPreset =
        previewWidget && previewWidget.supportedPresets.includes(selectedPreset)
            ? selectedPreset
            : ((previewWidget?.defaultPreset as GridPresetKey | undefined) ?? "2x2");

    if (!previewWidget) {
        return null;
    }

    return (
        <div className="space-y-6">
            <WidgetPreviewStage
                item={previewWidget}
                preset={resolvedPreset}
                onPresetChange={setSelectedPreset}
            />

            <div className="flex items-center gap-3">
                <div className="relative min-w-0 flex-1">
                    <Search
                        size={14}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                    <Input
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        placeholder={t("component_market_search_placeholder")}
                        className="h-10 rounded-xl border-border/70 bg-background/82 pl-9 pr-3 shadow-none"
                    />
                </div>

                <button
                    type="button"
                    onClick={() => onAddItem(previewWidget, resolvedPreset)}
                    className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-foreground px-4 text-sm font-semibold text-background transition-opacity hover:opacity-90 active:scale-[0.98]"
                >
                    <Plus size={14} strokeWidth={2.8} />
                    {t("add")}
                </button>
            </div>

            {visibleItems.length === 0 ? (
                <AppModalEmptyState
                    icon={Search}
                    message={t("component_market_no_components_found")}
                />
            ) : null}

            {filteredSections.map((section) => {
                return (
                    <div key={section.id}>
                        <h4 className="mb-3 px-0.5 text-[10px] font-semibold uppercase tracking-widest text-foreground/30">
                            {t(section.labelKey)}
                        </h4>
                        <div className="grid grid-cols-3 gap-3 2xl:grid-cols-4">
                            {section.items.map((item) => (
                                <WidgetPreviewCard
                                    key={item.id}
                                    item={item}
                                    isActive={item.id === previewWidget.id}
                                    onSelect={() => {
                                        setSelectedWidgetId(item.id);
                                        setSelectedPreset(item.defaultPreset);
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function toWidgetMarketItem(widget: SystemWidgetManifestItem): ComponentMarketItem {
    return {
        id: widget.id,
        kind: "widget",
        title: widget.title,
        supportedPresets: widget.supportedPresets as readonly GridPresetKey[],
        defaultPreset: widget.defaultPreset as GridPresetKey,
        sectionId: widget.collection ?? "standalone",
        sectionLabelKey: widget.collection ? `collection_${widget.collection}` : "component_market_standalone",
        item: widget,
    };
}

function toAppMarketItem(app: SystemAppManifestItem): ComponentMarketItem {
    return {
        id: app.id,
        kind: "app",
        title: app.title,
        supportedPresets: ["1x1"],
        defaultPreset: "1x1",
        sectionId: app.category ?? "other",
        sectionLabelKey: `category_${app.category ?? "other"}`,
        item: app,
    };
}

function groupAppsByCategory(
    apps: readonly SystemAppManifestItem[]
): Array<[string, SystemAppManifestItem[]]> {
    const grouped = new Map<string, SystemAppManifestItem[]>();
    for (const app of apps) {
        const category = app.category ?? "other";
        if (!grouped.has(category)) {
            grouped.set(category, []);
        }
        grouped.get(category)?.push(app);
    }
    return [...grouped.entries()];
}

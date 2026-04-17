import { useTranslation } from "react-i18next";
import {
    SYSTEM_WIDGET_MANIFEST,
    getWidgetCollections,
    getWidgetsByCollection,
    type SystemWidgetManifestItem,
} from "@/launcher/registry";
import type { GridPresetKey } from "@/launcher/layout";
import { WidgetPreviewCard } from "./WidgetPreviewCard";

interface WidgetGalleryProps {
    onAddWidget: (widget: SystemWidgetManifestItem, preset: GridPresetKey) => void;
}

export function WidgetGallery({ onAddWidget }: WidgetGalleryProps) {
    const { t } = useTranslation();

    const collections = getWidgetCollections();
    const standaloneWidgets = (SYSTEM_WIDGET_MANIFEST as readonly SystemWidgetManifestItem[]).filter(
        (w) => !(w as SystemWidgetManifestItem).collection
    );

    return (
        <div className="space-y-6">
            {collections.map((collection) => {
                const widgets = getWidgetsByCollection(collection);
                return (
                    <div key={collection}>
                        <h4 className="text-[10px] font-semibold uppercase tracking-widest text-foreground/30 mb-3 px-0.5">
                            {t(`collection_${collection}`)}
                        </h4>
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5">
                            {widgets.map((widget) => (
                                <WidgetPreviewCard key={widget.id} widget={widget} onAdd={onAddWidget} />
                            ))}
                        </div>
                    </div>
                );
            })}

            {standaloneWidgets.length > 0 && (
                <div>
                    <h4 className="text-[10px] font-semibold uppercase tracking-widest text-foreground/30 mb-3 px-0.5">
                        {t("component_market_standalone")}
                    </h4>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5">
                        {standaloneWidgets.map((widget) => (
                            <WidgetPreviewCard key={widget.id} widget={widget} onAdd={onAddWidget} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

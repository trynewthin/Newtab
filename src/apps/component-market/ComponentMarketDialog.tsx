import { useState } from "react";
import { useItemStore } from "@/launcher/store/item";
import type { SystemWidgetManifestItem } from "@/launcher/widget";
import { GRID_ITEM_PRESETS, type GridPresetKey } from "@/launcher/grid/layoutPresets";
import { AppModalV1 } from "@/components/modal/AppModalV1";
import { MarketTabBar, type MarketTab } from "./components/MarketTabBar";
import { AppIconGrid } from "./components/AppIconGrid";
import { WidgetGallery } from "./components/WidgetGallery";

interface ComponentMarketDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ComponentMarketDialog({ open, onOpenChange }: ComponentMarketDialogProps) {
    const { addItem } = useItemStore();
    const [activeTab, setActiveTab] = useState<MarketTab>("icons");

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

    return (
        <AppModalV1
            open={open}
            onOpenChange={onOpenChange}
            header={<MarketTabBar activeTab={activeTab} onTabChange={setActiveTab} />}
        >
            {activeTab === "icons"
                ? <AppIconGrid />
                : <WidgetGallery onAddWidget={handleAddWidget} />
            }
        </AppModalV1>
    );
}

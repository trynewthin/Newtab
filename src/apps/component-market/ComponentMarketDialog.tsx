import { useState } from "react";
import { useItemStore, type NewItemInput } from "@/launcher/store";
import type { SystemWidgetManifestItem } from "@/launcher/registry";
import { GRID_ITEM_PRESETS, type GridPresetKey } from "@/launcher/layout";
import { AppModalV1 } from "@/platform/ui/modal/AppModalV1";
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
        const newItem: NewItemInput = {
            title: widget.title,
            widgetId: widget.id,
            ownerAppId: widget.ownerAppId,
            icon: widget.icon,
            w: size.w,
            h: size.h,
        };
        addItem(newItem);
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

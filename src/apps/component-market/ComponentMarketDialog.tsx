import { useState } from "react";
import { useItemStore, type NewItemInput } from "@/launcher/store";
import type { SystemWidgetManifestItem } from "@/launcher/registry";
import { GRID_ITEM_PRESETS, type GridPresetKey } from "@/launcher/layout";
import { AppModalV2Closable } from "@/platform/ui/modal";
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
        <AppModalV2Closable
            open={open}
            onOpenChange={onOpenChange}
            contentLayer={(
                <div className="flex h-full min-h-0 flex-col">
                    <div className="flex min-h-16 items-center justify-center border-b border-border/70 px-4 py-3 sm:px-6">
                        <MarketTabBar activeTab={activeTab} onTabChange={setActiveTab} />
                    </div>
                    <div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar px-4 py-4 sm:px-6 sm:py-5">
                        {activeTab === "icons"
                            ? <AppIconGrid />
                            : <WidgetGallery onAddWidget={handleAddWidget} />}
                    </div>
                </div>
            )}
        />
    );
}

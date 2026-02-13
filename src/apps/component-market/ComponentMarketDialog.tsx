import { useState } from "react";
import { useItemStore } from "@/launcher/store/item";
import type { SystemWidgetManifestItem } from "@/launcher/widget";
import { GRID_ITEM_PRESETS, type GridPresetKey } from "@/launcher/grid/layoutPresets";
import { cn } from "@/core/utils";
import { Dialog } from "@base-ui/react/dialog";
import { LAYER_Z_INDEX } from "@/core/layerZIndex";
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
                            "modal-minimal-scope relative h-full w-full overflow-hidden isolate",
                            "sm:rounded-2xl",
                            "shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_2px_8px_rgba(0,0,0,0.12),0_12px_40px_rgba(0,0,0,0.24),0_32px_80px_rgba(0,0,0,0.18)]",
                        )}
                    >
                        {/* Background layer */}
                        <div className="absolute inset-0 z-0" style={{ backgroundColor: 'var(--background)' }} />

                        {/* ── Floating header bar ── */}
                        <MarketTabBar activeTab={activeTab} onTabChange={setActiveTab} />

                        {/* ── Scroll content ── */}
                        <div className="relative z-10 h-full">
                            <div className="h-full overflow-y-auto custom-scrollbar px-5">
                                <div className="h-16 shrink-0" />
                                {activeTab === "icons"
                                    ? <AppIconGrid />
                                    : <WidgetGallery onAddWidget={handleAddWidget} />
                                }
                                <div className="h-10 shrink-0" />
                            </div>
                        </div>
                    </div>
                </Dialog.Popup>
            </Dialog.Portal>
        </Dialog.Root>
    );
}

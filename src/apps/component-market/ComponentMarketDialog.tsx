import { useItemStore, type NewItemInput } from "@/launcher/store";
import type {
    SystemAppManifestItem,
    SystemWidgetManifestItem,
} from "@/launcher/registry";
import { GRID_ITEM_PRESETS, type GridPresetKey } from "@/launcher/layout";
import { AppModalV2, AppModalV2CloseButton, GradualBlur } from "@/platform/ui";
import { useTranslation } from "react-i18next";
import type { WidgetConfig } from "@/shared/types";
import {
    WidgetGallery,
    type ComponentMarketItem,
} from "./components/WidgetGallery";

interface ComponentMarketDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ComponentMarketDialog({ open, onOpenChange }: ComponentMarketDialogProps) {
    const { t } = useTranslation();
    const { addItem } = useItemStore();

    const handleAddItem = (entry: ComponentMarketItem, preset: GridPresetKey, config?: WidgetConfig) => {
        const newItem = buildNewItemInput(entry, preset, config);
        addItem(newItem);
        onOpenChange(false);
    };

    return (
        <AppModalV2
            open={open}
            onOpenChange={onOpenChange}
            contentLayer={(
                <div className="flex h-full min-h-0 flex-col">
                    <div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar px-4 pb-4 pt-20 sm:px-6 sm:pb-5 sm:pt-20">
                        <WidgetGallery onAddItem={handleAddItem} />
                    </div>
                </div>
            )}
            floatLayer={(
                <div className="pointer-events-none absolute inset-x-0 top-0 z-10">
                    <GradualBlur
                        target="parent"
                        preset="header"
                        height="3.75rem"
                        strength={2}
                        divCount={5}
                        curve="bezier"
                        exponential
                        opacity={1}
                        zIndex={0}
                        className="inset-x-0 top-0"
                    />

                    <div className="relative z-10 flex h-16 items-center justify-between px-4 sm:px-6">
                        <div className="pointer-events-auto z-10 flex min-w-9 shrink-0 items-center justify-start">
                            <AppModalV2CloseButton />
                        </div>

                        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-16 sm:px-20">
                            <div className="pointer-events-auto flex min-w-0 w-full max-w-full items-center justify-center">
                                <div className="truncate text-sm font-semibold tracking-tight text-foreground">
                                    {t("component_market_title")}
                                </div>
                            </div>
                        </div>

                        <div className="min-w-9 shrink-0" />
                    </div>
                </div>
            )}
        />
    );
}

function buildNewItemInput(
    entry: ComponentMarketItem,
    preset: GridPresetKey,
    config?: WidgetConfig
): NewItemInput {
    if (entry.kind === "widget") {
        return buildWidgetInput(entry.item, preset, config);
    }

    return buildAppInput(entry.item);
}

function buildWidgetInput(
    widget: SystemWidgetManifestItem,
    preset: GridPresetKey,
    config?: WidgetConfig
): NewItemInput {
    const size = GRID_ITEM_PRESETS[preset];
    return {
        title: widget.title,
        widgetId: widget.id,
        ownerAppId: widget.ownerAppId,
        icon: widget.icon,
        w: size.w,
        h: size.h,
        config,
    };
}

function buildAppInput(app: SystemAppManifestItem): NewItemInput {
    return {
        title: app.title,
        appId: app.id,
        icon: app.icon,
    };
}

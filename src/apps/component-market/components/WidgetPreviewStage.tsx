import { useMemo, type CSSProperties } from "react";
import { useContainerWidth } from "react-grid-layout";
import { useAppearancePreferenceStore } from "@/config";
import { isDynamicBackgroundId } from "@/core/dynamicBackgrounds";
import { LauncherGridItemSurface } from "@/launcher";
import {
    resolveLauncherGridItemPixelSize,
    resolveLauncherGridRowHeight,
    resolveLauncherGridTotalCols,
    resolvePresetSize,
    resolveSemanticCols,
    type GridPresetKey,
} from "@/launcher/layout";
import type { GridItem, LauncherWidgetItem, SystemAppItem } from "@/launcher/model/itemTypes";
import { DynamicBackgroundEffect } from "@/platform/ui";
import { cn } from "@/shared/utils";
import type { WidgetConfig } from "@/shared/types";
import type { BackgroundConfig } from "@/shared/types/background";
import type { ComponentMarketItem } from "./WidgetGallery";

interface WidgetPreviewStageProps {
    item: ComponentMarketItem;
    preset: GridPresetKey;
    onPresetChange: (preset: GridPresetKey) => void;
    config?: WidgetConfig;
}

function getPreviewBackgroundStyle(
    backgroundConfig: BackgroundConfig
): CSSProperties {
    if (backgroundConfig.type === "solid") {
        return { backgroundColor: backgroundConfig.value };
    }

    if (backgroundConfig.type === "gradient") {
        return { backgroundImage: backgroundConfig.value };
    }

    if (backgroundConfig.type === "image") {
        return {
            backgroundImage: `url(${backgroundConfig.value})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
        };
    }

    return {
        backgroundImage:
            "radial-gradient(120% 120% at 50% 0%, #0b1220 0%, #050b1a 55%, #030712 100%)",
    };
}

export function WidgetPreviewStage({
    item,
    preset,
    onPresetChange,
    config,
}: WidgetPreviewStageProps) {
    const { width, containerRef } = useContainerWidth({ initialWidth: 960 });
    const { backgroundConfig, dynamicBackgroundConfig } = useAppearancePreferenceStore();

    const activeThemeId =
        backgroundConfig.type === "theme" && isDynamicBackgroundId(backgroundConfig.value)
            ? backgroundConfig.value
            : null;

    const gridSize = resolvePresetSize(preset);
    const previewItem = useMemo<GridItem>(
        () => buildPreviewItem(item, preset, gridSize, config),
        [config, gridSize, item, preset]
    );

    const stageWidth = Math.max(width - 48, 320);
    const semanticCols = resolveSemanticCols(stageWidth);
    const totalCols = resolveLauncherGridTotalCols(semanticCols);
    const rowHeight = resolveLauncherGridRowHeight(stageWidth, totalCols);
    const previewSize = resolveLauncherGridItemPixelSize(gridSize, rowHeight);
    const supportedPresets = item.supportedPresets;

    return (
        <div
            ref={containerRef}
            className="relative min-h-[22rem] overflow-hidden rounded-[2rem] border border-foreground/10 bg-background/80 shadow-[0_20px_60px_rgba(0,0,0,0.12)]"
        >
            <div
                className="absolute inset-0"
                style={getPreviewBackgroundStyle(backgroundConfig)}
            >
                <DynamicBackgroundEffect
                    backgroundId={activeThemeId}
                    configMap={dynamicBackgroundConfig}
                />
                <div className="absolute inset-0 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.03] pointer-events-none" />
            </div>

            <div className="absolute inset-0 bg-gradient-to-b from-black/6 via-transparent to-black/12" />

            <div className="relative flex min-h-[22rem] items-center justify-center p-6 sm:p-8">
                <div
                    className="relative"
                    style={{
                        width: `${previewSize.width}px`,
                        height: `${previewSize.height}px`,
                    }}
                >
                    <LauncherGridItemSurface
                        item={previewItem}
                        isEditing={false}
                        onClick={() => {}}
                        onEdit={() => {}}
                        onDeletePrompt={() => {}}
                    />
                </div>
            </div>

            <div className="pointer-events-none absolute bottom-4 right-4 z-10">
                {supportedPresets.length > 1 ? (
                    <div className="pointer-events-auto flex items-center gap-2">
                        {supportedPresets.map((candidatePreset) => {
                            return (
                                <button
                                    key={candidatePreset}
                                    type="button"
                                    aria-label={candidatePreset}
                                    title={candidatePreset}
                                    onClick={() => onPresetChange(candidatePreset)}
                                    className={cn(
                                        "rounded-2xl border px-3 py-2 text-xs font-semibold tracking-wide backdrop-blur-xl transition-colors",
                                        candidatePreset === preset
                                            ? "border-white/18 bg-black/28 text-white"
                                            : "border-white/12 bg-black/20 text-white/78 hover:border-white/18 hover:bg-black/28 hover:text-white"
                                    )}
                                >
                                    {candidatePreset}
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    <div className="pointer-events-auto rounded-2xl border border-white/12 bg-black/20 px-3 py-2 text-xs font-semibold tracking-wide text-white/85 backdrop-blur-xl">
                        {preset}
                    </div>
                )}
            </div>
        </div>
    );
}

function buildPreviewItem(
    item: ComponentMarketItem,
    preset: GridPresetKey,
    gridSize: { w: number; h: number },
    config?: WidgetConfig
): GridItem {
    if (item.kind === "app") {
        const appItem: SystemAppItem = {
            id: `market-preview-${item.id}`,
            kind: "app",
            appId: item.item.id,
            title: item.item.title,
            icon: item.item.icon,
            w: gridSize.w,
            h: gridSize.h,
        };
        return appItem;
    }

    const widgetItem: LauncherWidgetItem = {
        id: `market-preview-${item.id}-${preset}`,
        kind: "widget",
        widgetId: item.item.id,
        ownerAppId: item.item.ownerAppId,
        title: item.item.title,
        icon: item.item.icon,
        w: gridSize.w,
        h: gridSize.h,
        config,
    };
    return widgetItem;
}

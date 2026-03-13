import type { ComponentType, MouseEvent } from "react";
import type { LauncherWidgetItem } from "@/state/core/itemTypes";

export type AppSurface = "modal" | "page";
export type LauncherTilePreset = "1x1" | "2x1" | "1x2" | "2x2" | "2x4" | "4x2";
export type LauncherTileVariant = "icon" | "panel";
export type AppSurfaceFramePreset = "free" | "semi" | "sidebar";

export interface AppSurfaceConfig {
    modal: boolean;
    page: boolean;
}

export interface AppSurfaceFrameConfig {
    modal: AppSurfaceFramePreset;
}

export interface AppIconLayoutConfig {
    variant: LauncherTileVariant;
    draggable: boolean;
    resizable: boolean;
    defaultPreset: LauncherTilePreset;
    allowedPresets: readonly LauncherTilePreset[];
}

export interface AppLauncherLayoutConfig {
    icon: AppIconLayoutConfig;
}

export interface AppModalRendererProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    appId?: string;
    framePreset?: AppSurfaceFramePreset;
}

export interface AppPageRendererProps {
    appId: string;
}

export interface WidgetRenderProps {
    item: LauncherWidgetItem;
    preset: LauncherTilePreset;
    gridSize: { w: number; h: number };
    className?: string;
    onActivate?: (event?: MouseEvent) => void;
}

export type WidgetResizeAxis = "both" | "horizontal" | "vertical";

export interface WidgetResizeRange {
    minW: number;
    maxW: number;
    minH: number;
    maxH: number;
    axis?: WidgetResizeAxis;
}

export interface WidgetManifest {
    id: string;
    title: string;
    icon: string;
    ownerAppId?: string;
    launchAppId?: string;
    collection?: string;
    variant: LauncherTileVariant;
    draggable: boolean;
    resizable: boolean;
    defaultPreset: LauncherTilePreset;
    supportedPresets: readonly LauncherTilePreset[];
    resizeRange?: WidgetResizeRange;
    renderer: ComponentType<WidgetRenderProps>;
}

export interface AppManifest {
    id: string;
    title: string;
    icon: string;
    category?: string;
    surfaces: AppSurfaceConfig;
    frames: AppSurfaceFrameConfig;
    launcher: AppLauncherLayoutConfig;
    defaultSurface: "modal";
    pagePath?: string;
    capabilities?: readonly string[];
    widgets?: readonly WidgetManifest[];
    modalLoader?: () => Promise<{ default: ComponentType<AppModalRendererProps> }>;
    pageLoader?: () => Promise<{ default: ComponentType<AppPageRendererProps> }>;
}

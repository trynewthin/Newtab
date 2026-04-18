import type { ComponentType, MouseEvent } from "react";

export type AppSurface = "modal" | "page";
export type LauncherTilePreset = "1x1" | "2x1" | "1x2" | "2x2" | "2x4" | "4x2";
export type LauncherTileVariant = "icon" | "panel";
export type AppSurfaceFramePreset = "free" | "semi" | "sidebar";
export type WidgetConfigValue = string | number | boolean;
export type WidgetConfig = Record<string, WidgetConfigValue>;

export interface LauncherWidgetItem {
    id: string;
    kind: "widget";
    widgetId: string;
    ownerAppId?: string;
    title: string;
    icon?: string;
    x?: number;
    y?: number;
    w?: number;
    h?: number;
    config?: WidgetConfig;
}

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
    config: WidgetConfig;
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

export interface WidgetConfigFieldOption {
    value: string;
    label: string;
}

interface WidgetConfigFieldBase<Key extends string, Value extends WidgetConfigValue> {
    key: Key;
    label: string;
    description?: string;
    defaultValue: Value;
}

export interface WidgetSelectConfigField extends WidgetConfigFieldBase<string, string> {
    type: "select";
    options: readonly WidgetConfigFieldOption[];
}

export interface WidgetSwitchConfigField extends WidgetConfigFieldBase<string, boolean> {
    type: "switch";
}

export interface WidgetRangeConfigField extends WidgetConfigFieldBase<string, number> {
    type: "range";
    min: number;
    max: number;
    step?: number;
}

export interface WidgetTextConfigField extends WidgetConfigFieldBase<string, string> {
    type: "text";
    placeholder?: string;
}

export type WidgetConfigField =
    | WidgetSelectConfigField
    | WidgetSwitchConfigField
    | WidgetRangeConfigField
    | WidgetTextConfigField;

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
    configFields?: readonly WidgetConfigField[];
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

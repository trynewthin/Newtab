import type { LauncherWidgetItem as SharedLauncherWidgetItem } from "@/shared/types";

export type ItemKind = "tag" | "app" | "folder" | "widget";

export interface BaseItem {
    id: string;
    kind: ItemKind;
    title: string;
    x?: number;
    y?: number;
    w?: number;
    h?: number;
}

export interface WebTagItem extends BaseItem {
    kind: "tag";
    url: string;
    icon?: string;
    iconDataUrl?: string;
    backgroundColor?: string;
    iconSize?: number;
}

export interface SystemAppItem extends BaseItem {
    kind: "app";
    appId: string;
    icon?: string;
}

export type LauncherWidgetItem = SharedLauncherWidgetItem;

export type FolderDisplayMode = "1x1" | "2x2";

export interface FolderItem extends BaseItem {
    kind: "folder";
    children: (WebTagItem | SystemAppItem)[];
    icon?: string;
    displayMode?: FolderDisplayMode;
}

export type GridItem = WebTagItem | SystemAppItem | LauncherWidgetItem | FolderItem;

export type ItemId = string;

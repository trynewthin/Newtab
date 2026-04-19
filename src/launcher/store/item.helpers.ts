import type {
    FolderItem,
    GridItem,
    LauncherWidgetItem,
    SystemAppItem,
    WebTagItem,
} from "@/launcher/model/itemTypes";
import { backgroundStorage } from "@/platform/storage/backgroundStorage";
import { SYSTEM_ITEMS } from "@/launcher/registry";
import { GRID_ITEM_PRESETS } from "@/launcher/layout/layoutPresets";
import {
    getWidgetManifestItem,
    isSystemWidgetId,
    normalizeWidgetConfig,
    resolveLegacyWidgetId,
} from "@/launcher/registry";
import { isSystemAppBlocked, isSystemAppId } from "@/launcher/registry/appManifest";
import type { NewItemInput } from "./item.types";

export function migrateLegacyWidgetItem(item: GridItem): GridItem {
    const legacyAppItem = item as SystemAppItem & { tileType?: string };

    if (
        legacyAppItem.kind === "app" &&
        legacyAppItem.tileType === "widget" &&
        typeof legacyAppItem.appId === "string"
    ) {
        const widgetId = resolveLegacyWidgetId(legacyAppItem.appId);
        if (widgetId) {
            const widget = getWidgetManifestItem(widgetId);
            const fallbackSize = GRID_ITEM_PRESETS[widget?.defaultPreset ?? "2x2"];
            return {
                id: legacyAppItem.id,
                kind: "widget",
                widgetId,
                ownerAppId: legacyAppItem.appId,
                title: legacyAppItem.title || widget?.title || "widget_generic",
                icon: legacyAppItem.icon || widget?.icon,
                x: legacyAppItem.x,
                y: legacyAppItem.y,
                w: legacyAppItem.w ?? fallbackSize.w,
                h: legacyAppItem.h ?? fallbackSize.h,
                config: normalizeWidgetConfig(widgetId),
            };
        }
    }

    return item;
}

export function stripUnavailableItems(items: GridItem[]): GridItem[] {
    const next: GridItem[] = [];
    const shouldDropApp = (appId: string) => !isSystemAppId(appId) || isSystemAppBlocked(appId);
    const shouldDropWidget = (widgetId: string) => !isSystemWidgetId(widgetId) || !getWidgetManifestItem(widgetId);

    for (const item of items) {
        if (item.kind === "app" && shouldDropApp(item.appId)) {
            continue;
        }

        if (item.kind === "widget" && shouldDropWidget(item.widgetId)) {
            continue;
        }

        if (item.kind === "folder") {
            const filteredChildren = item.children.filter(
                (child) => !(child.kind === "app" && shouldDropApp(child.appId))
            );

            if (filteredChildren.length === 0) {
                continue;
            }

            next.push({
                ...item,
                children: filteredChildren,
            });
            continue;
        }

        next.push(item);
    }

    return next;
}

export const DEFAULT_ITEMS: GridItem[] = SYSTEM_ITEMS.map((item) => ({
    id: `sys-${item.type}`,
    kind: "app" as const,
    appId: item.type,
    title: item.title,
    icon: item.icon,
}));

export function buildNewGridItem(itemData: NewItemInput): GridItem {
    const id = crypto.randomUUID();

    if ("url" in itemData && typeof itemData.url === "string") {
        return { ...itemData, id, kind: "tag" } as WebTagItem;
    }

    if ("widgetId" in itemData && typeof itemData.widgetId === "string") {
        const widget = isSystemWidgetId(itemData.widgetId)
            ? getWidgetManifestItem(itemData.widgetId)
            : null;
        return {
            ...itemData,
            id,
            kind: "widget",
            title: itemData.title || widget?.title || "widget_generic",
            icon: itemData.icon || widget?.icon,
            config: normalizeWidgetConfig(itemData.widgetId, itemData.config),
        } as LauncherWidgetItem;
    }

    if ("appId" in itemData && typeof itemData.appId === "string") {
        return { ...itemData, id, kind: "app" } as SystemAppItem;
    }

    return { ...itemData, id, kind: "tag", url: "#" } as WebTagItem;
}

export function cleanupRemovedItemIcon(items: GridItem[], id: string): void {
    const findAndCleanupIcon = (list: GridItem[]): boolean => {
        for (const item of list) {
            if (item.id === id) {
                if (item.kind === "tag" && item.iconDataUrl?.startsWith("idb://")) {
                    const key = item.iconDataUrl.replace("idb://", "");
                    backgroundStorage.deleteIcon(key).catch(console.error);
                }
                return true;
            }
            if (item.kind === "folder" && item.children) {
                if (findAndCleanupIcon(item.children)) {
                    return true;
                }
            }
        }
        return false;
    };

    findAndCleanupIcon(items);
}

export function updateItemInStructure(
    list: GridItem[],
    id: string,
    updates: Partial<GridItem>
): GridItem[] {
    return list.map((item) => {
        if (item.id === id) {
            return { ...item, ...updates } as GridItem;
        }

        if (item.kind === "folder") {
            return {
                ...item,
                children: updateItemInStructure(item.children, id, updates) as (WebTagItem | SystemAppItem)[],
            };
        }

        return item;
    });
}

export function removeItemsFromStructure(list: GridItem[], ids: readonly string[]): GridItem[] {
    const result: GridItem[] = [];

    for (const item of list) {
        if (ids.includes(item.id)) {
            continue;
        }

        if (item.kind === "folder") {
            const newChildren = removeItemsFromStructure(item.children, ids);
            if (newChildren.length === 0) {
                continue;
            }
            if (newChildren.length === 1) {
                result.push(newChildren[0]);
                continue;
            }
            result.push({
                ...item,
                children: newChildren as (WebTagItem | SystemAppItem)[],
            });
            continue;
        }

        result.push(item);
    }

    return result;
}

export function groupItemsIntoFolder(
    items: GridItem[],
    ids: readonly string[],
    title?: string
): GridItem[] {
    if (ids.length <= 1) {
        return items;
    }

    const selectedItems = items.filter((item) => ids.includes(item.id));
    const firstSelectedIndex = items.findIndex((item) => ids.includes(item.id));
    const anchorItem = selectedItems[0];

    if (firstSelectedIndex === -1 || selectedItems.length === 0) {
        return items;
    }

    const selectedFolders = selectedItems.filter((item) => item.kind === "folder") as FolderItem[];
    const selectedOthers = selectedItems.filter(
        (item): item is WebTagItem | SystemAppItem => item.kind === "tag" || item.kind === "app"
    );

    let targetFolder: FolderItem;
    let otherSelectedFolders: FolderItem[] = [];

    if (selectedFolders.length > 0) {
        targetFolder = { ...selectedFolders[0] };
        otherSelectedFolders = selectedFolders.slice(1);
    } else {
        targetFolder = {
            id: `folder_${crypto.randomUUID()}`,
            kind: "folder",
            title: title || "New Folder",
            children: [],
            x: anchorItem?.x,
            y: anchorItem?.y,
            w: anchorItem?.w,
            h: anchorItem?.h,
        };
    }

    const newChildren = [...(targetFolder.children || [])];
    newChildren.push(...selectedOthers);

    for (const folder of otherSelectedFolders) {
        if (folder.children) {
            newChildren.push(
                ...folder.children.filter(
                    (child): child is WebTagItem | SystemAppItem =>
                        child.kind === "tag" || child.kind === "app"
                )
            );
        }
    }

    targetFolder.children = newChildren;

    const newItems = items.filter((item) => !ids.includes(item.id));
    newItems.splice(firstSelectedIndex, 0, targetFolder);
    return newItems;
}

export function ungroupFolderItem(items: GridItem[], id: string): GridItem[] {
    const folderIndex = items.findIndex((item) => item.id === id);
    const folder = items[folderIndex];

    if (!folder || folder.kind !== "folder" || !folder.children) {
        return items;
    }

    const next = [...items];
    next.splice(folderIndex, 1, ...(folder.children as GridItem[]));
    return next;
}

export function organizeGridItems(items: GridItem[]): GridItem[] {
    return items
        .map((item, index) => ({ item, index }))
        .sort((a, b) => {
            const ay = Number.isFinite(a.item.y) ? (a.item.y as number) : Number.MAX_SAFE_INTEGER;
            const by = Number.isFinite(b.item.y) ? (b.item.y as number) : Number.MAX_SAFE_INTEGER;
            if (ay !== by) {
                return ay - by;
            }

            const ax = Number.isFinite(a.item.x) ? (a.item.x as number) : Number.MAX_SAFE_INTEGER;
            const bx = Number.isFinite(b.item.x) ? (b.item.x as number) : Number.MAX_SAFE_INTEGER;
            if (ax !== bx) {
                return ax - bx;
            }

            return a.index - b.index;
        })
        .map(({ item }) => ({
            ...item,
            x: undefined,
            y: undefined,
        }) as GridItem);
}

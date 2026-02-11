import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createPersistConfig } from '@/platform/state/core/storage';
import { backgroundStorage } from '@/platform/state/core/backgroundStorage';
import type {
    GridItem,
    WebTagItem,
    SystemAppItem,
    FolderItem,
    LauncherWidgetItem,
} from '@/platform/state/core/itemTypes';
import { SYSTEM_ITEMS } from '@/apps/launcher';
import { getWidgetManifestItem, isSystemWidgetId, resolveLegacyWidgetId } from '@/apps/launcher/widget';
import { GRID_ITEM_PRESETS } from '@/apps/launcher/grid/layoutPresets';

type NewItemInput =
    | Omit<WebTagItem, 'id' | 'kind'>
    | Omit<SystemAppItem, 'id' | 'kind'>
    | Omit<LauncherWidgetItem, 'id' | 'kind'>;

interface ItemState {
    items: GridItem[];

    addItem: (item: NewItemInput) => void;
    updateItem: (id: string, updates: Partial<GridItem>) => void;
    removeItem: (id: string) => void;
    batchRemoveItems: (ids: string[]) => void;
    setItems: (items: GridItem[]) => void;

    // Complex Actions
    batchGroupItems: (ids: string[], title?: string) => void;
    ungroupFolder: (id: string) => void;
    organizeItems: () => void;
}

function migrateLegacyWidgetItem(item: GridItem): GridItem {
    if (
        item.kind === 'app' &&
        (item as any).tileType === "widget" &&
        typeof item.appId === "string"
    ) {
        const widgetId = resolveLegacyWidgetId(item.appId);
        if (widgetId) {
            const widget = getWidgetManifestItem(widgetId);
            const fallbackSize = GRID_ITEM_PRESETS[widget?.defaultPreset ?? "2x2"];
            return {
                id: item.id,
                kind: "widget",
                widgetId,
                ownerAppId: item.appId,
                title: item.title || widget?.title || "Widget",
                icon: item.icon || widget?.icon,
                x: item.x,
                y: item.y,
                w: item.w ?? fallbackSize.w,
                h: item.h ?? fallbackSize.h,
            };
        }
    }

    return item;
}

// Map SYSTEM_ITEMS to new SystemAppItem format
const DEFAULT_ITEMS: GridItem[] = [
    ...SYSTEM_ITEMS.map(item => ({
        id: `sys-${item.type}`,
        kind: 'app' as const,
        appId: item.type,
        title: item.title,
        icon: item.icon,
    })),
];

export const useItemStore = create<ItemState>()(
    persist(
        (set) => ({
            items: DEFAULT_ITEMS,

            addItem: (itemData: NewItemInput) => set((state: ItemState) => {
                let newItem: GridItem;
                const id = crypto.randomUUID();

                if ("url" in itemData && typeof itemData.url === "string") {
                    newItem = { ...itemData, id, kind: 'tag' } as WebTagItem;
                } else if ("widgetId" in itemData) {
                    const widget = isSystemWidgetId(itemData.widgetId)
                        ? getWidgetManifestItem(itemData.widgetId)
                        : null;
                    newItem = {
                        ...itemData,
                        id,
                        kind: 'widget',
                        title: itemData.title || widget?.title || "Widget",
                        icon: itemData.icon || widget?.icon,
                    } as LauncherWidgetItem;
                } else if ("appId" in itemData && typeof itemData.appId === "string") {
                    newItem = { ...itemData, id, kind: 'app' } as SystemAppItem;
                } else {
                    newItem = { ...itemData, id, kind: 'tag', url: '#' } as WebTagItem;
                }

                return { items: [...state.items, newItem] };
            }),

            updateItem: (id: string, updates: Partial<GridItem>) => set((state: ItemState) => ({
                items: state.items.map(item => item.id === id ? { ...item, ...updates } as GridItem : item)
            })),

            removeItem: (id: string) => set((state: ItemState) => {
                const findAndCleanupIcon = (list: GridItem[]): boolean => {
                    for (const item of list) {
                        if (item.id === id) {
                            if (item.kind === 'tag' && item.iconDataUrl?.startsWith('idb://')) {
                                const key = item.iconDataUrl.replace('idb://', '');
                                backgroundStorage.deleteIcon(key).catch(console.error);
                            }
                            return true;
                        }
                        if (item.kind === 'folder' && item.children) {
                            if (findAndCleanupIcon(item.children)) return true;
                        }
                    }
                    return false;
                };
                findAndCleanupIcon(state.items);

                const refineStructure = (list: GridItem[]): GridItem[] => {
                    const result: GridItem[] = [];
                    for (const item of list) {
                        if (item.id === id) continue;

                        if (item.kind === 'folder') {
                            const newChildren = refineStructure(item.children);
                            if (newChildren.length === 0) {
                                continue;
                            } else if (newChildren.length === 1) {
                                result.push(newChildren[0]);
                            } else {
                                result.push({ ...item, children: newChildren as (WebTagItem | SystemAppItem)[] });
                            }
                        } else {
                            result.push(item);
                        }
                    }
                    return result;
                };

                return { items: refineStructure(state.items) };
            }),

            batchRemoveItems: (ids: string[]) => set((state: ItemState) => {
                const refineStructure = (list: GridItem[]): GridItem[] => {
                    const result: GridItem[] = [];
                    for (const item of list) {
                        if (ids.includes(item.id)) continue;

                        if (item.kind === 'folder') {
                            const newChildren = refineStructure(item.children);
                            if (newChildren.length === 0) continue;
                            else if (newChildren.length === 1) result.push(newChildren[0]);
                            else result.push({ ...item, children: newChildren as (WebTagItem | SystemAppItem)[] });
                        } else {
                            result.push(item);
                        }
                    }
                    return result;
                };
                return { items: refineStructure(state.items) };
            }),

            setItems: (items: GridItem[]) => set({ items }),

            batchGroupItems: (ids: string[], title?: string) => set((state: ItemState) => {
                if (ids.length <= 1) return state;

                const selectedItems = state.items.filter(t => ids.includes(t.id));
                const firstSelectedIndex = state.items.findIndex(t => ids.includes(t.id));
                const anchorItem = selectedItems[0];

                if (firstSelectedIndex === -1 || selectedItems.length === 0) return state;

                const selectedFolders = selectedItems.filter(t => t.kind === 'folder') as FolderItem[];
                const selectedOthers = selectedItems.filter(
                    (t): t is WebTagItem | SystemAppItem => t.kind === "tag" || t.kind === "app"
                );

                let targetFolder: FolderItem;
                let otherSelectedFolders: FolderItem[] = [];

                if (selectedFolders.length > 0) {
                    targetFolder = { ...selectedFolders[0] };
                    otherSelectedFolders = selectedFolders.slice(1);
                } else {
                    targetFolder = {
                        id: `folder_${crypto.randomUUID()}`,
                        kind: 'folder',
                        title: title || 'New Folder',
                        children: [],
                        x: anchorItem?.x,
                        y: anchorItem?.y,
                        w: anchorItem?.w,
                        h: anchorItem?.h,
                    };
                }

                const newChildren = [...(targetFolder.children || [])];
                newChildren.push(...selectedOthers);

                otherSelectedFolders.forEach(folder => {
                    if (folder.children) {
                        newChildren.push(...folder.children.filter(
                            (child): child is WebTagItem | SystemAppItem => child.kind === "tag" || child.kind === "app"
                        ));
                    }
                });

                targetFolder.children = newChildren;

                const newItems = state.items.filter(t => !ids.includes(t.id));
                newItems.splice(firstSelectedIndex, 0, targetFolder);

                return { items: newItems };
            }),

            ungroupFolder: (id: string) => set((state: ItemState) => {
                const folderIndex = state.items.findIndex(t => t.id === id);
                const folder = state.items[folderIndex];

                if (!folder || folder.kind !== 'folder' || !folder.children) return state;

                const newItems = [...state.items];
                newItems.splice(folderIndex, 1, ...(folder.children as GridItem[]));

                return { items: newItems };
            }),

            organizeItems: () => set((state: ItemState) => {
                const ordered = state.items
                    .map((item, index) => ({ item, index }))
                    .sort((a, b) => {
                        const ay = typeof a.item.y === "number" ? a.item.y : Number.MAX_SAFE_INTEGER;
                        const by = typeof b.item.y === "number" ? b.item.y : Number.MAX_SAFE_INTEGER;
                        if (ay !== by) return ay - by;

                        const ax = typeof a.item.x === "number" ? a.item.x : Number.MAX_SAFE_INTEGER;
                        const bx = typeof b.item.x === "number" ? b.item.x : Number.MAX_SAFE_INTEGER;
                        if (ax !== bx) return ax - bx;

                        return a.index - b.index;
                    })
                    .map(({ item }) => ({
                        ...item,
                        x: undefined,
                        y: undefined,
                    }) as GridItem);

                return { items: ordered };
            }),
        }),
        {
            ...createPersistConfig('app-items'),
            version: 6,
            migrate: (persistedState: unknown) => {
                if (!persistedState || typeof persistedState !== "object") {
                    return persistedState;
                }

                const state = persistedState as { items?: GridItem[] };
                if (!Array.isArray(state.items)) {
                    return persistedState;
                }

                return {
                    ...state,
                    items: state.items.map((item) => migrateLegacyWidgetItem(item)),
                };
            },
        }
    )
);


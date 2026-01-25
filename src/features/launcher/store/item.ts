import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createPersistConfig } from '@/store/core/storage';
import { backgroundStorage } from '@/store/core/backgroundStorage';
import type { GridItem, WebTagItem, SystemAppItem, FolderItem } from '@/store/core/itemTypes';
import { SYSTEM_ITEMS } from '@/features/launcher';

interface ItemState {
    items: GridItem[];

    addItem: (item: Omit<WebTagItem, 'id' | 'kind'> | Omit<SystemAppItem, 'id' | 'kind'>) => void;
    updateItem: (id: string, updates: Partial<GridItem>) => void;
    removeItem: (id: string) => void;
    batchRemoveItems: (ids: string[]) => void;
    setItems: (items: GridItem[]) => void;

    // Complex Actions
    batchGroupItems: (ids: string[], title?: string) => void;
    ungroupFolder: (id: string) => void;
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
    // Default Web Tags
    {
        id: 'github',
        kind: 'tag',
        title: 'GitHub',
        url: 'https://github.com',
        icon: 'https://github.com/favicon.ico',
        backgroundColor: 'rgba(255, 255, 255, 0.05)'
    } as WebTagItem,
    {
        id: 'bilibili',
        kind: 'tag',
        title: 'Bilibili',
        url: 'https://www.bilibili.com',
        icon: 'https://www.bilibili.com/favicon.ico',
        backgroundColor: 'rgba(255, 255, 255, 0.05)'
    } as WebTagItem,
    {
        id: 'v2ex',
        kind: 'tag',
        title: 'V2EX',
        url: 'https://www.v2ex.com',
        icon: 'https://www.v2ex.com/static/favicon.ico',
        backgroundColor: 'rgba(255, 255, 255, 0.05)'
    } as WebTagItem
];

export const useItemStore = create<ItemState>()(
    persist(
        (set) => ({
            items: DEFAULT_ITEMS,

            addItem: (itemData: any) => set((state: ItemState) => {
                let newItem: GridItem;
                const id = crypto.randomUUID();

                if (itemData.url) {
                    newItem = { ...itemData, id, kind: 'tag' } as WebTagItem;
                } else if (itemData.appId) {
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

                if (firstSelectedIndex === -1 || selectedItems.length === 0) return state;

                const selectedFolders = selectedItems.filter(t => t.kind === 'folder') as FolderItem[];
                const selectedOthers = selectedItems.filter(t => t.kind !== 'folder') as (WebTagItem | SystemAppItem)[];

                let targetFolder: FolderItem;
                let otherSelectedFolders: FolderItem[] = [];

                if (selectedFolders.length > 0) {
                    targetFolder = { ...selectedFolders[0] };
                    otherSelectedFolders = selectedFolders.slice(1);
                } else {
                    targetFolder = {
                        id: `folder_${Date.now()}`,
                        kind: 'folder',
                        title: title || 'New Folder',
                        children: []
                    };
                }

                const newChildren = [...(targetFolder.children || [])];
                newChildren.push(...selectedOthers);

                otherSelectedFolders.forEach(folder => {
                    if (folder.children) {
                        newChildren.push(...folder.children);
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
        }),
        {
            ...createPersistConfig('app-items'),
            version: 3, // Bump version to start fresh
        }
    )
);

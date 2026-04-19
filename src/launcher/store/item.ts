import { create } from "zustand";
import { persist } from "zustand/middleware";
import { storageRegistry } from "@/platform/persistence/registry";
import { createPersistConfig } from "@/platform/persistence/zustandStorage";
import type { GridItem } from "@/launcher/model/itemTypes";
import type { ItemState, NewItemInput } from "./item.types";
import {
    DEFAULT_ITEMS,
    buildNewGridItem,
    cleanupRemovedItemIcon,
    groupItemsIntoFolder,
    migrateLegacyWidgetItem,
    organizeGridItems,
    removeItemsFromStructure,
    stripUnavailableItems,
    ungroupFolderItem,
    updateItemInStructure,
} from "./item.helpers";
import { mergePersistedItemState } from "./item.persistence";

type PersistedItemState = {
    items?: GridItem[];
    layoutRevision?: number;
};

const ITEM_STORAGE_KEY = "app-items";

export const useItemStore = create<ItemState>()(
    persist(
        (set) => ({
            items: DEFAULT_ITEMS,
            layoutRevision: 0,

            addItem: (itemData: NewItemInput) =>
                set((state: ItemState) => ({
                    items: [...state.items, buildNewGridItem(itemData)],
                })),

            updateItem: (id: string, updates: Partial<GridItem>) =>
                set((state: ItemState) => ({
                    items: updateItemInStructure(state.items, id, updates),
                })),

            removeItem: (id: string) =>
                set((state: ItemState) => {
                    cleanupRemovedItemIcon(state.items, id);
                    return { items: removeItemsFromStructure(state.items, [id]) };
                }),

            batchRemoveItems: (ids: string[]) =>
                set((state: ItemState) => ({
                    items: removeItemsFromStructure(state.items, ids),
                })),

            setItems: (items: GridItem[]) => set({ items }),

            batchGroupItems: (ids: string[], title?: string) =>
                set((state: ItemState) => ({
                    items: groupItemsIntoFolder(state.items, ids, title),
                })),

            ungroupFolder: (id: string) =>
                set((state: ItemState) => ({
                    items: ungroupFolderItem(state.items, id),
                })),

            organizeItems: () =>
                set((state: ItemState) => ({
                    items: organizeGridItems(state.items),
                    layoutRevision: state.layoutRevision + 1,
                })),
        }),
        {
            ...createPersistConfig<ItemState, PersistedItemState>(ITEM_STORAGE_KEY),
            version: 9,
            merge: mergePersistedItemState,
            migrate: (persistedState: unknown): PersistedItemState => {
                if (!persistedState || typeof persistedState !== "object") {
                    return {};
                }

                const state = persistedState as PersistedItemState;
                if (!Array.isArray(state.items)) {
                    return state;
                }

                return {
                    ...state,
                    items: stripUnavailableItems(
                        state.items.map((item) => migrateLegacyWidgetItem(item))
                    ),
                };
            },
        }
    )
);

storageRegistry.registerRehydrator(
    ITEM_STORAGE_KEY,
    () => useItemStore.persist.rehydrate()
);

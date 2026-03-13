import { create } from "zustand";
import { persist } from "zustand/middleware";
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
} from "./item.helpers";

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
                    items: state.items.map((item) =>
                        item.id === id ? ({ ...item, ...updates } as GridItem) : item
                    ),
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
            ...createPersistConfig("app-items"),
            version: 9,
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
                    items: stripUnavailableItems(
                        state.items.map((item) => migrateLegacyWidgetItem(item))
                    ),
                };
            },
        }
    )
);

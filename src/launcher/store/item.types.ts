import type {
    GridItem,
    LauncherWidgetItem,
    SystemAppItem,
    WebTagItem,
} from "@/launcher/model/itemTypes";

export type NewItemInput =
    | Omit<WebTagItem, "id" | "kind">
    | Omit<SystemAppItem, "id" | "kind">
    | Omit<LauncherWidgetItem, "id" | "kind">;

export interface ItemState {
    items: GridItem[];
    layoutRevision: number;
    addItem: (item: NewItemInput) => void;
    updateItem: (id: string, updates: Partial<GridItem>) => void;
    removeItem: (id: string) => void;
    batchRemoveItems: (ids: string[]) => void;
    setItems: (items: GridItem[]) => void;
    batchGroupItems: (ids: string[], title?: string) => void;
    ungroupFolder: (id: string) => void;
    organizeItems: () => void;
}

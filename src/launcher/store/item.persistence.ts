import type { GridItem } from "@/launcher/model/itemTypes"
import type { ItemState } from "./item.types"
import {
    migrateLegacyWidgetItem,
    stripUnavailableItems,
} from "./item.helpers"

interface PersistedItemStateShape {
    items?: GridItem[]
    layoutRevision?: number
}

export function mergePersistedItemState(
    persistedState: unknown,
    currentState: ItemState
): ItemState {
    const persisted = (persistedState as PersistedItemStateShape | undefined) ?? {}
    const rawItems = Array.isArray(persisted.items) ? persisted.items : currentState.items
    const normalizedItems = stripUnavailableItems(rawItems.map((item) => migrateLegacyWidgetItem(item)))

    return {
        ...currentState,
        ...persisted,
        items: normalizedItems,
    }
}

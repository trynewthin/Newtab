export const DEFAULT_ITEM_ICON_VALUE = "__default_item_icon__";

export function isDefaultItemIconValue(value: string | null | undefined): boolean {
    return value === DEFAULT_ITEM_ICON_VALUE;
}

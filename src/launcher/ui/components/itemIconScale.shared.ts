export const DEFAULT_ITEM_ICON_SCALE = 1;
export const SMALL_FOLDER_PREVIEW_ICON_SCALE_FACTOR = 0.84;

export function resolveItemIconScale(value: number | undefined): number {
    return typeof value === "number" && Number.isFinite(value)
        ? value
        : DEFAULT_ITEM_ICON_SCALE;
}

export function resolveSmallFolderPreviewIconScale(value: number | undefined): number {
    return resolveItemIconScale(value) * SMALL_FOLDER_PREVIEW_ICON_SCALE_FACTOR;
}

export const ICON_CORNER_RADIUS_PRESET_VALUES = [12, 16, 18, 24] as const;

export type IconCornerRadiusPreset = (typeof ICON_CORNER_RADIUS_PRESET_VALUES)[number];

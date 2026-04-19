export type LauncherIconKindV1 = "system" | "emoji" | "image" | "default";

interface BaseLauncherIconSeedV1 {
    id?: string;
    title: string;
    backgroundColor?: string;
    scale?: number;
    frameClassName?: string;
}

export interface SystemLauncherIconSeedV1 extends BaseLauncherIconSeedV1 {
    kind: "system";
    iconName: string;
}

export interface EmojiLauncherIconSeedV1 extends BaseLauncherIconSeedV1 {
    kind: "emoji";
    emoji: string;
}

export interface ImageLauncherIconSeedV1 extends BaseLauncherIconSeedV1 {
    kind: "image";
    imageSrc?: string;
    imageRef?: string;
    fallbackImageSrc?: string;
}

export interface DefaultLauncherIconSeedV1 extends BaseLauncherIconSeedV1 {
    kind: "default";
}

export type LauncherIconSeedV1 =
    | SystemLauncherIconSeedV1
    | EmojiLauncherIconSeedV1
    | ImageLauncherIconSeedV1
    | DefaultLauncherIconSeedV1;

export interface ResolvedLauncherIconV1 {
    id?: string;
    title: string;
    kind: LauncherIconKindV1;
    value?: string;
    backgroundColor?: string;
    scale: number;
    frameClassName?: string;
}

export type FolderIconLayoutV1 = "compact" | "expanded";

export interface FolderIconLayoutSpecV1 {
    columns: number;
    maxIcons: number;
    gap: number;
    padding: number;
    cellRadius: number;
}

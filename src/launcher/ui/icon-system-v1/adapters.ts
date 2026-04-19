import { resolveItemIconScale } from "@/launcher/ui/components/itemIconScale.shared";
import { isDefaultItemIconValue } from "@/launcher/ui/icons/defaultItemIcon.shared";
import type { FolderItem, SystemAppItem, WebTagItem } from "@/launcher/model/itemTypes";
import type { FolderIconLayoutV1, LauncherIconSeedV1 } from "./types";

const SYSTEM_ICON_FRAME_CLASS = "!bg-white dark:!bg-black text-black dark:text-white";

function translateTitle(title: string, translate?: (value: string) => string) {
    if (!title.startsWith("sys_")) {
        return title;
    }

    return translate ? translate(title) : title;
}

function resolveTagFallbackIconUrl(item: WebTagItem) {
    return `https://www.google.com/s2/favicons?domain=${item.url}&sz=64`;
}

export function resolveSystemAppIconSeedV1(
    item: SystemAppItem,
    options?: { translateTitle?: (value: string) => string }
): LauncherIconSeedV1 {
    if (!item.icon) {
        return {
            id: item.id,
            kind: "default",
            title: translateTitle(item.title, options?.translateTitle),
            frameClassName: SYSTEM_ICON_FRAME_CLASS,
            scale: 0.85,
        };
    }

    return {
        id: item.id,
        kind: "system",
        title: translateTitle(item.title, options?.translateTitle),
        iconName: item.icon,
        frameClassName: SYSTEM_ICON_FRAME_CLASS,
        scale: 0.85,
    };
}

export function resolveTagIconSeedV1(item: WebTagItem): LauncherIconSeedV1 {
    const scale = resolveItemIconScale(item.iconSize);

    if (item.icon && item.icon.length < 4) {
        return {
            id: item.id,
            kind: "emoji",
            title: item.title,
            emoji: item.icon,
            backgroundColor: item.backgroundColor ?? "transparent",
            scale,
        };
    }

    const fallbackImageSrc = resolveTagFallbackIconUrl(item);
    const directImageSrc = item.iconDataUrl?.startsWith("idb://")
        ? undefined
        : item.iconDataUrl || (item.icon && !isDefaultItemIconValue(item.icon) ? item.icon : undefined);

    if (directImageSrc || item.iconDataUrl?.startsWith("idb://")) {
        return {
            id: item.id,
            kind: "image",
            title: item.title,
            imageSrc: directImageSrc,
            imageRef: item.iconDataUrl?.startsWith("idb://")
                ? item.iconDataUrl.replace("idb://", "")
                : undefined,
            fallbackImageSrc,
            backgroundColor: item.backgroundColor ?? "transparent",
            scale,
        };
    }

    if (isDefaultItemIconValue(item.icon)) {
        return {
            id: item.id,
            kind: "default",
            title: item.title,
            backgroundColor: item.backgroundColor ?? "transparent",
            scale,
        };
    }

    return {
        id: item.id,
        kind: "image",
        title: item.title,
        imageSrc: fallbackImageSrc,
        fallbackImageSrc,
        backgroundColor: item.backgroundColor ?? "transparent",
        scale,
    };
}

export function resolveLauncherIconSeedV1(
    item: SystemAppItem | WebTagItem,
    options?: { translateTitle?: (value: string) => string }
): LauncherIconSeedV1 {
    if (item.kind === "app") {
        return resolveSystemAppIconSeedV1(item, options);
    }

    return resolveTagIconSeedV1(item);
}

function getFolderLayoutSpec(layout: FolderIconLayoutV1) {
    return layout === "expanded" ? { maxIcons: 9 } : { maxIcons: 4 };
}

export function resolveFolderChildIconSeedsV1(
    item: FolderItem,
    layout: FolderIconLayoutV1,
    options?: { translateTitle?: (value: string) => string }
): LauncherIconSeedV1[] {
    const { maxIcons } = getFolderLayoutSpec(layout);

    return item.children.slice(0, maxIcons).map((child) => {
        return resolveLauncherIconSeedV1(child, options);
    });
}

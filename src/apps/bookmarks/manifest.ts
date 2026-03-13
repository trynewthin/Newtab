import type { AppManifest } from "@/shared/types";

export const bookmarksManifest = {
    id: "bookmarks",
    title: "sys_bookmarks",
    icon: "Bookmarks",
    category: "browser",
    surfaces: { modal: true, page: false },
    frames: { modal: "semi" },
    launcher: {
        icon: {
            variant: "icon",
            draggable: true,
            resizable: false,
            defaultPreset: "1x1",
            allowedPresets: ["1x1"],
        },
    },
    defaultSurface: "modal",
    modalLoader: () => import("./dialog"),
} as const satisfies AppManifest;

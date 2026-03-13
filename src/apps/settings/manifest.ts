import type { AppManifest } from "@/shared/types";

export const settingsManifest = {
    id: "settings",
    title: "sys_settings",
    icon: "Settings",
    category: "system",
    surfaces: { modal: true, page: false },
    frames: { modal: "sidebar" },
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

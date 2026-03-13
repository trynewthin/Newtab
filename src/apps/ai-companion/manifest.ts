import type { AppManifest } from "@/shared/types";

export const aiCompanionManifest = {
    id: "ai",
    title: "sys_ai",
    icon: "Sparkles",
    category: "productivity",
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

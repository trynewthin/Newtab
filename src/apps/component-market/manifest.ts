import type { AppManifest } from "@/shared/types";

export const componentMarketManifest = {
    id: "component-market",
    title: "sys_component_market",
    icon: "Grid3x3",
    category: "system",
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

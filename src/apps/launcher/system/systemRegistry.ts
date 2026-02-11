import type { SystemAppId, SystemType as ManifestSystemType } from "./appManifest";
import { SYSTEM_APP_MANIFEST } from "./appManifest";

export type SystemType = ManifestSystemType;

export interface SystemItem {
    type: SystemAppId;
    title: string;
    icon: string; // Simplified for simplicity since assets are strings
}

export const SYSTEM_ITEMS: SystemItem[] = [
    ...SYSTEM_APP_MANIFEST.map((app) => ({
        type: app.id,
        title: app.title,
        icon: app.icon,
    })),
];

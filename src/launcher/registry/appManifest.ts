import type {
    AppManifest,
    AppSurface,
    AppSurfaceFramePreset,
    AppLauncherLayoutConfig,
} from "@/shared/types";
import { settingsManifest } from "@/apps/settings";
import { downloadsManifest } from "@/apps/downloads";
import { bookmarksManifest } from "@/apps/bookmarks";
import { historyManifest } from "@/apps/history";
import { componentMarketManifest } from "@/apps/component-market";

export type {
    AppSurface,
    AppSurfaceFramePreset,
    AppLauncherLayoutConfig,
} from "@/shared/types";

export const SYSTEM_APP_MANIFEST: readonly AppManifest[] = [
    settingsManifest,
    downloadsManifest,
    bookmarksManifest,
    historyManifest,
    componentMarketManifest,
] as const;

export const SYSTEM_APP_IDS = SYSTEM_APP_MANIFEST.map((app) => app.id) as readonly AppId[];

export const SYSTEM_UTILITY_IDS = [
    "theme",
    "add",
    "icon-manager",
] as const;

export type AppId = (typeof SYSTEM_APP_MANIFEST)[number]["id"];
export type SystemAppId = AppId;
export type SystemUtilityId = (typeof SYSTEM_UTILITY_IDS)[number];
export type SystemType = SystemAppId | SystemUtilityId;
export type SystemAppManifestItem = (typeof SYSTEM_APP_MANIFEST)[number];

export interface SystemPageRoute {
    appId: SystemAppId;
    path: string;
}

const DEV_BLOCKED_APP_IDS = [] as const satisfies readonly SystemAppId[];
const blockedAppSet = new Set<SystemAppId>(DEV_BLOCKED_APP_IDS);

export const BLOCKED_SYSTEM_APP_IDS: readonly SystemAppId[] = [...DEV_BLOCKED_APP_IDS];

export const ENABLED_SYSTEM_APP_IDS: readonly SystemAppId[] = SYSTEM_APP_IDS.filter(
    (id) => !blockedAppSet.has(id)
);

export const ENABLED_SYSTEM_APP_MANIFEST: readonly SystemAppManifestItem[] = SYSTEM_APP_MANIFEST.filter(
    (item) => !blockedAppSet.has(item.id)
);

export const VALID_SYSTEM_TYPES: readonly SystemType[] = [
    ...SYSTEM_APP_IDS,
    ...SYSTEM_UTILITY_IDS,
] as const;

export function isSystemAppId(value: string): value is SystemAppId {
    return (SYSTEM_APP_IDS as readonly string[]).includes(value);
}

export function isSystemAppBlocked(appId: string): boolean {
    return isSystemAppId(appId) && blockedAppSet.has(appId);
}

export function supportsSurface(appId: SystemType, surface: AppSurface): boolean {
    const item = getAppManifestItem(appId);
    if (!item) return false;
    return item.surfaces[surface];
}

export function getAppManifestItem(appId: SystemType): SystemAppManifestItem | null {
    if (!isSystemAppId(appId)) return null;
    if (blockedAppSet.has(appId)) return null;
    return SYSTEM_APP_MANIFEST.find((entry) => entry.id === appId) ?? null;
}

export function getAppLauncherLayoutConfig(appId: SystemType): AppLauncherLayoutConfig | null {
    const item = getAppManifestItem(appId);
    return item?.launcher ?? null;
}

export function getAppSurfaceFramePreset(
    appId: SystemType,
    surface: "modal"
): AppSurfaceFramePreset {
    const item = getAppManifestItem(appId);
    if (!item) return "semi";
    return item.frames[surface] ?? "semi";
}

export function getSystemPageRoutes(): readonly SystemPageRoute[] {
    return ENABLED_SYSTEM_APP_MANIFEST.reduce<SystemPageRoute[]>((acc, entry) => {
        if (entry.surfaces.page && entry.pagePath) {
            acc.push({
                appId: entry.id,
                path: entry.pagePath,
            });
        }
        return acc;
    }, []);
}

export function resolveLaunchTarget(
    appId: SystemType,
    options?: {
        ctrlKey?: boolean;
        metaKey?: boolean;
    }
): { surface: AppSurface; pagePath?: string } {
    const item = getAppManifestItem(appId);
    if (!item) return { surface: "modal" };

    const wantsPage = !!(options?.ctrlKey || options?.metaKey);
    if (wantsPage && item.surfaces.page && item.pagePath) {
        return { surface: "page", pagePath: item.pagePath };
    }

    if (item.defaultSurface === "modal" && item.surfaces.modal) {
        return { surface: "modal" };
    }

    if (item.surfaces.modal) {
        return { surface: "modal" };
    }

    if (item.surfaces.page && item.pagePath) {
        return { surface: "page", pagePath: item.pagePath };
    }

    return { surface: "modal" };
}

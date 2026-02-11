export type AppSurface = "modal" | "page";
export type LauncherTilePreset = "1x1" | "2x1" | "1x2" | "2x2" | "2x4";
export type LauncherTileVariant = "icon" | "panel";
export type AppSurfaceFramePreset = "free" | "semi" | "sidebar";

export interface AppSurfaceConfig {
    modal: boolean;
    page: boolean;
}

export interface AppSurfaceFrameConfig {
    modal: AppSurfaceFramePreset;
}

export interface AppIconLayoutConfig {
    variant: LauncherTileVariant;
    draggable: boolean;
    resizable: boolean;
    defaultPreset: LauncherTilePreset;
    allowedPresets: readonly LauncherTilePreset[];
}

export interface AppLauncherLayoutConfig {
    icon: AppIconLayoutConfig;
}

export const SYSTEM_APP_IDS = [
    "settings",
    "ai",
    "downloads",
    "bookmarks",
    "history",
    "component-market",
] as const;

export const SYSTEM_UTILITY_IDS = [
    "theme",
    "add",
    "icon-manager",
] as const;

export type SystemAppId = (typeof SYSTEM_APP_IDS)[number];
export type SystemUtilityId = (typeof SYSTEM_UTILITY_IDS)[number];
export type SystemType = SystemAppId | SystemUtilityId;

export interface SystemAppManifestItem {
    id: SystemAppId;
    title: string;
    icon: string;
    surfaces: AppSurfaceConfig;
    frames: AppSurfaceFrameConfig;
    launcher: AppLauncherLayoutConfig;
    defaultSurface: "modal";
    pagePath?: string;
}

export interface SystemPageRoute {
    appId: SystemAppId;
    path: string;
}

const DEV_BLOCKED_APP_IDS = [] as const satisfies readonly SystemAppId[];

const ICON_ONLY_LAYOUT = {
    icon: {
        variant: "icon",
        draggable: true,
        resizable: false,
        defaultPreset: "1x1",
        allowedPresets: ["1x1"],
    },
} as const satisfies AppLauncherLayoutConfig;

const DEFAULT_FRAMES = {
    modal: "semi",
} as const satisfies AppSurfaceFrameConfig;

const SETTINGS_FRAMES = {
    modal: "sidebar",
} as const satisfies AppSurfaceFrameConfig;

export const SYSTEM_APP_MANIFEST = [
    {
        id: "settings",
        title: "sys_settings",
        icon: "Settings",
        surfaces: { modal: true, page: false },
        frames: SETTINGS_FRAMES,
        launcher: ICON_ONLY_LAYOUT,
        defaultSurface: "modal",
    },
    {
        id: "ai",
        title: "sys_ai",
        icon: "Sparkles",
        surfaces: { modal: true, page: false },
        frames: DEFAULT_FRAMES,
        launcher: ICON_ONLY_LAYOUT,
        defaultSurface: "modal",
    },
    {
        id: "downloads",
        title: "sys_downloads",
        icon: "Downloads",
        surfaces: { modal: true, page: false },
        frames: DEFAULT_FRAMES,
        launcher: ICON_ONLY_LAYOUT,
        defaultSurface: "modal",
    },
    {
        id: "bookmarks",
        title: "sys_bookmarks",
        icon: "Bookmarks",
        surfaces: { modal: true, page: false },
        frames: DEFAULT_FRAMES,
        launcher: ICON_ONLY_LAYOUT,
        defaultSurface: "modal",
    },
    {
        id: "history",
        title: "sys_history",
        icon: "History",
        surfaces: { modal: true, page: false },
        frames: DEFAULT_FRAMES,
        launcher: ICON_ONLY_LAYOUT,
        defaultSurface: "modal",
    },
    {
        id: "component-market",
        title: "sys_component_market",
        icon: "Grid3x3",
        surfaces: { modal: true, page: false },
        frames: DEFAULT_FRAMES,
        launcher: ICON_ONLY_LAYOUT,
        defaultSurface: "modal",
    },
] as const satisfies readonly SystemAppManifestItem[];

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
        if (
            entry.surfaces.page &&
            "pagePath" in entry &&
            typeof entry.pagePath === "string" &&
            entry.pagePath.length > 0
        ) {
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

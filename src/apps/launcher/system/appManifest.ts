export type AppSurface = "modal" | "sidebar" | "page";
export type LauncherTilePreset = "1x1" | "2x1" | "1x2" | "2x2" | "2x4";
export type LauncherTileVariant = "icon" | "panel";
export type AppSurfaceFramePreset = "free" | "semi" | "sidebar";

export interface AppSurfaceConfig {
    modal: boolean;
    sidebar: boolean;
    page: boolean;
}

export interface AppSurfaceFrameConfig {
    modal: AppSurfaceFramePreset;
    sidebar: AppSurfaceFramePreset;
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
    "pomodoro",
    "todo",
    "ai",
    "downloads",
    "bookmarks",
    "history",
    "paper",
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
    defaultSurface: Exclude<AppSurface, "page">;
    pagePath?: string;
}

export interface SystemPageRoute {
    appId: SystemAppId;
    path: string;
}

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
    sidebar: "semi",
} as const satisfies AppSurfaceFrameConfig;

const SETTINGS_FRAMES = {
    modal: "sidebar",
    sidebar: "sidebar",
} as const satisfies AppSurfaceFrameConfig;

export const SYSTEM_APP_MANIFEST = [
    {
        id: "settings",
        title: "Settings",
        icon: "Settings",
        surfaces: { modal: true, sidebar: false, page: false },
        frames: SETTINGS_FRAMES,
        launcher: ICON_ONLY_LAYOUT,
        defaultSurface: "modal",
    },
    {
        id: "pomodoro",
        title: "Pomodoro",
        icon: "Timer",
        surfaces: { modal: true, sidebar: false, page: false },
        frames: DEFAULT_FRAMES,
        launcher: ICON_ONLY_LAYOUT,
        defaultSurface: "modal",
    },
    {
        id: "todo",
        title: "Todo List",
        icon: "ListTodo",
        surfaces: { modal: true, sidebar: false, page: false },
        frames: DEFAULT_FRAMES,
        launcher: ICON_ONLY_LAYOUT,
        defaultSurface: "modal",
    },
    {
        id: "ai",
        title: "AI Assistant",
        icon: "Sparkles",
        surfaces: { modal: true, sidebar: true, page: false },
        frames: DEFAULT_FRAMES,
        launcher: ICON_ONLY_LAYOUT,
        defaultSurface: "modal",
    },
    {
        id: "downloads",
        title: "Downloads",
        icon: "Downloads",
        surfaces: { modal: true, sidebar: false, page: false },
        frames: DEFAULT_FRAMES,
        launcher: ICON_ONLY_LAYOUT,
        defaultSurface: "modal",
    },
    {
        id: "bookmarks",
        title: "Bookmarks",
        icon: "Bookmarks",
        surfaces: { modal: true, sidebar: false, page: false },
        frames: DEFAULT_FRAMES,
        launcher: ICON_ONLY_LAYOUT,
        defaultSurface: "modal",
    },
    {
        id: "history",
        title: "History",
        icon: "History",
        surfaces: { modal: true, sidebar: false, page: false },
        frames: DEFAULT_FRAMES,
        launcher: ICON_ONLY_LAYOUT,
        defaultSurface: "modal",
    },
    {
        id: "paper",
        title: "Paper",
        icon: "FileText",
        surfaces: { modal: true, sidebar: true, page: true },
        frames: DEFAULT_FRAMES,
        launcher: ICON_ONLY_LAYOUT,
        defaultSurface: "modal",
        pagePath: "/paper",
    },
    {
        id: "component-market",
        title: "Component Market",
        icon: "Grid3x3",
        surfaces: { modal: true, sidebar: false, page: false },
        frames: DEFAULT_FRAMES,
        launcher: ICON_ONLY_LAYOUT,
        defaultSurface: "modal",
    },
] as const satisfies readonly SystemAppManifestItem[];

export const VALID_SYSTEM_TYPES: readonly SystemType[] = [
    ...SYSTEM_APP_IDS,
    ...SYSTEM_UTILITY_IDS,
] as const;

export const DEFAULT_SIDE_APPS: readonly SystemAppId[] = ["ai", "paper"] as const;

export function isSystemAppId(value: string): value is SystemAppId {
    return (SYSTEM_APP_IDS as readonly string[]).includes(value);
}

export function supportsSurface(appId: SystemType, surface: AppSurface): boolean {
    if (!isSystemAppId(appId)) return false;
    const item = SYSTEM_APP_MANIFEST.find((entry) => entry.id === appId);
    if (!item) return false;
    return item.surfaces[surface];
}

export function getAppManifestItem(appId: SystemType): SystemAppManifestItem | null {
    if (!isSystemAppId(appId)) return null;
    return SYSTEM_APP_MANIFEST.find((entry) => entry.id === appId) ?? null;
}

export function getAppLauncherLayoutConfig(appId: SystemType): AppLauncherLayoutConfig | null {
    const item = getAppManifestItem(appId);
    return item?.launcher ?? null;
}

export function getAppSurfaceFramePreset(
    appId: SystemType,
    surface: Exclude<AppSurface, "page">
): AppSurfaceFramePreset {
    const item = getAppManifestItem(appId);
    if (!item) return "semi";
    return item.frames[surface] ?? "semi";
}

export function getSystemPageRoutes(): readonly SystemPageRoute[] {
    return SYSTEM_APP_MANIFEST.reduce<SystemPageRoute[]>((acc, entry) => {
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
        altKey?: boolean;
    }
): { surface: AppSurface; pagePath?: string } {
    const item = getAppManifestItem(appId);
    if (!item) return { surface: "modal" };

    const wantsPage = !!(options?.ctrlKey || options?.metaKey);
    if (wantsPage && item.surfaces.page && item.pagePath) {
        return { surface: "page", pagePath: item.pagePath };
    }

    const wantsSidebar = !!options?.altKey;
    if (wantsSidebar && item.surfaces.sidebar) {
        return { surface: "sidebar" };
    }

    if (item.defaultSurface === "sidebar" && item.surfaces.sidebar) {
        return { surface: "sidebar" };
    }

    if (item.defaultSurface === "modal" && item.surfaces.modal) {
        return { surface: "modal" };
    }

    if (item.surfaces.modal) {
        return { surface: "modal" };
    }

    if (item.surfaces.sidebar) {
        return { surface: "sidebar" };
    }

    if (item.surfaces.page && item.pagePath) {
        return { surface: "page", pagePath: item.pagePath };
    }

    return { surface: "modal" };
}

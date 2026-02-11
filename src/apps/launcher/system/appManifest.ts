export type AppSurface = "modal" | "sidebar" | "page";

export const SYSTEM_APP_IDS = [
    "settings",
    "pomodoro",
    "todo",
    "ai",
    "downloads",
    "bookmarks",
    "history",
    "paper",
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
    surfaces: {
        modal: boolean;
        sidebar: boolean;
        page: boolean;
    };
    defaultSurface: Exclude<AppSurface, "page">;
    pagePath?: string;
}

export interface SystemPageRoute {
    appId: SystemAppId;
    path: string;
}

export const SYSTEM_APP_MANIFEST = [
    {
        id: "settings",
        title: "Settings",
        icon: "Settings",
        surfaces: { modal: true, sidebar: false, page: false },
        defaultSurface: "modal",
    },
    {
        id: "pomodoro",
        title: "Pomodoro",
        icon: "Timer",
        surfaces: { modal: true, sidebar: false, page: false },
        defaultSurface: "modal",
    },
    {
        id: "todo",
        title: "Todo List",
        icon: "ListTodo",
        surfaces: { modal: true, sidebar: false, page: false },
        defaultSurface: "modal",
    },
    {
        id: "ai",
        title: "AI Assistant",
        icon: "Sparkles",
        surfaces: { modal: true, sidebar: true, page: false },
        defaultSurface: "modal",
    },
    {
        id: "downloads",
        title: "Downloads",
        icon: "Downloads",
        surfaces: { modal: true, sidebar: false, page: false },
        defaultSurface: "modal",
    },
    {
        id: "bookmarks",
        title: "Bookmarks",
        icon: "Bookmarks",
        surfaces: { modal: true, sidebar: false, page: false },
        defaultSurface: "modal",
    },
    {
        id: "history",
        title: "History",
        icon: "History",
        surfaces: { modal: true, sidebar: false, page: false },
        defaultSurface: "modal",
    },
    {
        id: "paper",
        title: "Paper",
        icon: "FileText",
        surfaces: { modal: true, sidebar: true, page: true },
        defaultSurface: "modal",
        pagePath: "/paper",
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

    return { surface: "modal" };
}

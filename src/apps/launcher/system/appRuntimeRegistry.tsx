import { lazy } from "react";
import type { ComponentType, LazyExoticComponent } from "react";
import type { SystemAppId, SystemType } from "./appManifest";
import { isSystemAppId, SYSTEM_APP_IDS, SYSTEM_APP_MANIFEST } from "./appManifest";

export interface AppModalRendererProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export interface AppSidebarRendererProps {
    onClose: () => void;
}

export interface AppPageRendererProps {
    appId: SystemAppId;
}

type ModalRenderer = LazyExoticComponent<ComponentType<AppModalRendererProps>>;
type SidebarRenderer = LazyExoticComponent<ComponentType<AppSidebarRendererProps>>;
type PageRenderer = LazyExoticComponent<ComponentType<AppPageRendererProps>>;

type ManifestItemById<K extends SystemAppId> = Extract<
    (typeof SYSTEM_APP_MANIFEST)[number],
    { id: K }
>;

type RuntimeSurfaceRequirement<K extends SystemAppId> =
    (ManifestItemById<K>["surfaces"]["modal"] extends true ? { modal: ModalRenderer } : { modal?: ModalRenderer }) &
    (ManifestItemById<K>["surfaces"]["sidebar"] extends true ? { sidebar: SidebarRenderer } : { sidebar?: SidebarRenderer }) &
    (ManifestItemById<K>["surfaces"]["page"] extends true ? { page: PageRenderer } : { page?: PageRenderer });

type SystemRuntimeMap = {
    [K in SystemAppId]: { id: K } & RuntimeSurfaceRequirement<K>;
};

const modalLoaders: Record<SystemAppId, () => Promise<{ default: ComponentType<AppModalRendererProps> }>> = {
    settings: () => import("@/apps/settings").then((m) => ({ default: m.SettingsDialog })),
    pomodoro: () => import("@/apps/pomodoro").then((m) => ({ default: m.PomodoroDialog })),
    todo: () => import("@/apps/todo").then((m) => ({ default: m.TodoDialog })),
    ai: () => import("@/apps/ai-companion/AiDialog").then((m) => ({ default: m.AiDialog })),
    downloads: () => import("@/apps/downloads").then((m) => ({ default: m.DownloadsDialog })),
    bookmarks: () => import("@/apps/bookmarks").then((m) => ({ default: m.BookmarksDialog })),
    history: () => import("@/apps/history").then((m) => ({ default: m.HistoryDialog })),
    paper: () => import("@/apps/paper").then((m) => ({ default: m.PaperDialog })),
};

const sidebarLoaders: Partial<Record<SystemAppId, () => Promise<{ default: ComponentType<AppSidebarRendererProps> }>>> = {
    ai: () => import("@/apps/ai-companion/sidepanel/AiSideApp").then((m) => ({
        default: ({ onClose }: AppSidebarRendererProps) => <m.default onClose={onClose} />,
    })),
    paper: () => import("@/apps/paper").then((m) => ({
        default: ({ onClose }: AppSidebarRendererProps) => (
            <m.PaperEditor isSidebar={true} onClose={onClose} />
        ),
    })),
};

const pageLoaders: Partial<Record<SystemAppId, () => Promise<{ default: ComponentType<AppPageRendererProps> }>>> = {
    paper: () => import("@/apps/paper").then((m) => ({
        default: (_props: AppPageRendererProps) => <m.PaperPage />,
    })),
};

const SettingsDialog = lazy(modalLoaders.settings);
const PomodoroDialog = lazy(modalLoaders.pomodoro);
const TodoDialog = lazy(modalLoaders.todo);
const AiDialog = lazy(modalLoaders.ai);
const DownloadsDialog = lazy(modalLoaders.downloads);
const BookmarksDialog = lazy(modalLoaders.bookmarks);
const HistoryDialog = lazy(modalLoaders.history);
const PaperDialog = lazy(modalLoaders.paper);
const PaperPage = lazy(pageLoaders.paper!);
const PaperSidebar = lazy(sidebarLoaders.paper!);
const AiSidebar = lazy(sidebarLoaders.ai!);

const RUNTIMES: SystemRuntimeMap = {
    settings: { id: "settings", modal: SettingsDialog },
    pomodoro: { id: "pomodoro", modal: PomodoroDialog },
    todo: { id: "todo", modal: TodoDialog },
    ai: { id: "ai", modal: AiDialog, sidebar: AiSidebar },
    downloads: { id: "downloads", modal: DownloadsDialog },
    bookmarks: { id: "bookmarks", modal: BookmarksDialog },
    history: { id: "history", modal: HistoryDialog },
    paper: { id: "paper", modal: PaperDialog, sidebar: PaperSidebar, page: PaperPage },
};

function validateRuntimeSurfaceCoverage() {
    for (const app of SYSTEM_APP_MANIFEST) {
        const runtime = RUNTIMES[app.id];
        if (!runtime) {
            console.warn(`[appRuntimeRegistry] Missing runtime for app "${app.id}".`);
            continue;
        }

        if (app.surfaces.modal && !runtime.modal) {
            console.warn(`[appRuntimeRegistry] "${app.id}" declares modal support but has no modal renderer.`);
        }

        if (app.surfaces.sidebar && !runtime.sidebar) {
            console.warn(`[appRuntimeRegistry] "${app.id}" declares sidebar support but has no sidebar renderer.`);
        }

        if (app.surfaces.page && !runtime.page) {
            console.warn(`[appRuntimeRegistry] "${app.id}" declares page support but has no page renderer.`);
        }
    }
}

if (import.meta.env.DEV) {
    validateRuntimeSurfaceCoverage();
}

const preloadedModal = new Set<SystemAppId>();

export function preloadModalRuntime(appId: SystemAppId) {
    if (preloadedModal.has(appId)) return;
    const loader = modalLoaders[appId];
    if (!loader) return;

    preloadedModal.add(appId);
    void loader().catch(() => {
        preloadedModal.delete(appId);
    });
}

export function warmupModalRuntimes(appIds: readonly SystemAppId[] = SYSTEM_APP_IDS) {
    for (const appId of appIds) {
        preloadModalRuntime(appId);
    }
}

export function getModalRenderer(appId: SystemAppId): ModalRenderer | null {
    return RUNTIMES[appId]?.modal ?? null;
}

export function getSidebarRenderer(appId: SystemAppId): SidebarRenderer | null {
    return RUNTIMES[appId]?.sidebar ?? null;
}

export function getPageRenderer(appId: SystemAppId): PageRenderer | null {
    return RUNTIMES[appId]?.page ?? null;
}

export function resolveModalRuntimeAppId(active: SystemType | null): SystemAppId | "add" | null {
    if (!active) return null;
    if (active === "add") return "add";
    if (active === "theme" || active === "icon-manager") return "settings";
    if (isSystemAppId(active)) return active;
    return null;
}


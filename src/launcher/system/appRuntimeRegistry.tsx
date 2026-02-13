import { lazy } from "react";
import type { ComponentType, LazyExoticComponent } from "react";
import type { AppSurfaceFramePreset, SystemAppId, SystemType } from "./appManifest";
import {
    ENABLED_SYSTEM_APP_IDS,
    ENABLED_SYSTEM_APP_MANIFEST,
    getAppManifestItem,
    isSystemAppId,
    SYSTEM_APP_MANIFEST,
} from "./appManifest";

export interface AppModalRendererProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    appId?: SystemAppId;
    framePreset?: AppSurfaceFramePreset;
}

export interface AppPageRendererProps {
    appId: SystemAppId;
}

type ModalRenderer = LazyExoticComponent<ComponentType<AppModalRendererProps>>;
type PageRenderer = LazyExoticComponent<ComponentType<AppPageRendererProps>>;

type ManifestItemById<K extends SystemAppId> = Extract<
    (typeof SYSTEM_APP_MANIFEST)[number],
    { id: K }
>;

type RuntimeSurfaceRequirement<K extends SystemAppId> =
    (ManifestItemById<K>["surfaces"]["modal"] extends true ? { modal: ModalRenderer } : { modal?: ModalRenderer }) &
    (ManifestItemById<K>["surfaces"]["page"] extends true ? { page: PageRenderer } : { page?: PageRenderer });

type SystemRuntimeMap = {
    [K in SystemAppId]: { id: K } & RuntimeSurfaceRequirement<K>;
};

const modalLoaders: Record<SystemAppId, () => Promise<{ default: ComponentType<AppModalRendererProps> }>> = {
    settings: () => import("@/apps/settings").then((m) => ({ default: m.SettingsDialog })),
    ai: () => import("@/apps/ai-companion/AiDialog").then((m) => ({ default: m.AiDialog })),
    downloads: () => import("@/apps/downloads").then((m) => ({ default: m.DownloadsDialog })),
    bookmarks: () => import("@/apps/bookmarks").then((m) => ({ default: m.BookmarksDialog })),
    history: () => import("@/apps/history").then((m) => ({ default: m.HistoryDialog })),
    "component-market": () => import("@/apps/component-market").then((m) => ({ default: m.ComponentMarketDialog })),
};

const SettingsDialog = lazy(modalLoaders.settings);
const AiDialog = lazy(modalLoaders.ai);
const DownloadsDialog = lazy(modalLoaders.downloads);
const BookmarksDialog = lazy(modalLoaders.bookmarks);
const HistoryDialog = lazy(modalLoaders.history);
const ComponentMarketDialog = lazy(modalLoaders["component-market"]);

const RUNTIMES: SystemRuntimeMap = {
    settings: { id: "settings", modal: SettingsDialog },
    ai: { id: "ai", modal: AiDialog },
    downloads: { id: "downloads", modal: DownloadsDialog },
    bookmarks: { id: "bookmarks", modal: BookmarksDialog },
    history: { id: "history", modal: HistoryDialog },
    "component-market": { id: "component-market", modal: ComponentMarketDialog },
};

function validateRuntimeSurfaceCoverage() {
    for (const app of ENABLED_SYSTEM_APP_MANIFEST) {
        const runtime = RUNTIMES[app.id];
        if (!runtime) {
            console.warn(`[appRuntimeRegistry] Missing runtime for app "${app.id}".`);
            continue;
        }

        if (app.surfaces.modal && !runtime.modal) {
            console.warn(`[appRuntimeRegistry] "${app.id}" declares modal support but has no modal renderer.`);
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

export function warmupModalRuntimes(appIds: readonly SystemAppId[] = ENABLED_SYSTEM_APP_IDS) {
    for (const appId of appIds) {
        preloadModalRuntime(appId);
    }
}

export function getModalRenderer(appId: SystemAppId): ModalRenderer | null {
    return RUNTIMES[appId]?.modal ?? null;
}

export function getPageRenderer(appId: SystemAppId): PageRenderer | null {
    return RUNTIMES[appId]?.page ?? null;
}

export function resolveModalRuntimeAppId(active: SystemType | null): SystemAppId | "add" | null {
    if (!active) return null;
    if (active === "add") return "add";
    if (active === "theme" || active === "icon-manager") return "settings";
    if (isSystemAppId(active) && getAppManifestItem(active)) return active;
    return null;
}


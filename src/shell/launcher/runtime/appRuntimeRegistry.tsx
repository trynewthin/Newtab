import { lazy } from "react";
import type { ComponentType, LazyExoticComponent } from "react";
import type { AppModalRendererProps, AppPageRendererProps } from "@/shared/types";
import type { AppSurfaceFramePreset } from "@/shared/types";
import {
    ENABLED_SYSTEM_APP_IDS,
    ENABLED_SYSTEM_APP_MANIFEST,
    getAppManifestItem,
    isSystemAppId,
    type SystemAppId,
    type SystemType,
} from "@/shell/launcher/registry/appManifest";

export type { AppModalRendererProps, AppPageRendererProps };

type ModalRenderer = LazyExoticComponent<ComponentType<AppModalRendererProps>>;
type PageRenderer = LazyExoticComponent<ComponentType<AppPageRendererProps>>;

type RuntimeSurfaceRequirement = {
    id: SystemAppId;
    modal?: ModalRenderer;
    page?: PageRenderer;
};

const modalLoaders = Object.fromEntries(
    ENABLED_SYSTEM_APP_MANIFEST.map((app) => [
        app.id,
        app.modalLoader ?? (() => Promise.reject(new Error(`Missing modal loader for ${app.id}`))),
    ])
) as unknown as Record<SystemAppId, () => Promise<{ default: ComponentType<AppModalRendererProps> }>>;

const pageLoaders = Object.fromEntries(
    ENABLED_SYSTEM_APP_MANIFEST
        .filter((app) => app.pageLoader)
        .map((app) => [app.id, app.pageLoader!])
) as unknown as Partial<Record<SystemAppId, () => Promise<{ default: ComponentType<AppPageRendererProps> }>>>;

const RUNTIMES = Object.fromEntries(
    ENABLED_SYSTEM_APP_MANIFEST.map((app) => [
        app.id,
        {
            id: app.id,
            modal: lazy(modalLoaders[app.id]),
            page: pageLoaders[app.id] ? lazy(pageLoaders[app.id]!) : undefined,
        } satisfies RuntimeSurfaceRequirement,
    ])
) as Record<SystemAppId, RuntimeSurfaceRequirement>;

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

export type { AppSurfaceFramePreset };

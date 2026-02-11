import { useCallback } from "react";
import { useUIStore } from "@/apps/launcher/store/ui";
import type { SystemType } from "./systemRegistry";
import { preloadModalRuntime } from "./appRuntimeRegistry";
import {
    type AppSurface,
    getAppManifestItem,
    isSystemAppId,
    type SystemAppId,
    resolveLaunchTarget,
    supportsSurface,
} from "./appManifest";

export interface LaunchAppOptions {
    ctrlKey?: boolean;
    metaKey?: boolean;
    altKey?: boolean;
    newTabForPage?: boolean;
}

async function openBrowserSidePanel(appId: SystemAppId): Promise<boolean> {
    if (typeof window !== "undefined" && window.location.pathname.endsWith("/src/surfaces/sidepanel/index.html")) {
        const current = new URLSearchParams(window.location.search).get("app");
        if (current !== appId) {
            const next = new URL(window.location.href);
            next.searchParams.set("app", appId);
            window.location.assign(next.toString());
        }
        return true;
    }

    if (typeof chrome === "undefined" || !chrome.sidePanel?.setOptions || !chrome.sidePanel?.open) {
        return false;
    }

    const path = `src/surfaces/sidepanel/index.html?app=${encodeURIComponent(appId)}`;

    try {
        const tabId = await new Promise<number | null>((resolve) => {
            if (!chrome.tabs?.getCurrent) {
                resolve(null);
                return;
            }

            chrome.tabs.getCurrent((tab) => {
                resolve(tab?.id ?? null);
            });
        });

        if (tabId != null) {
            await chrome.sidePanel.setOptions({ tabId, path, enabled: true });
            await chrome.sidePanel.open({ tabId });
            return true;
        }

        const win = await chrome.windows.getCurrent();
        if (win.id == null) return false;

        await chrome.sidePanel.setOptions({ path, enabled: true });
        await chrome.sidePanel.open({ windowId: win.id });
        return true;
    } catch (error) {
        console.warn("[useAppLauncher] Failed to open browser side panel:", error);
        return false;
    }
}

export function useAppLauncher() {
    const { setActiveSystemDialog } = useUIStore();

    const launchToSurface = useCallback((
        appId: SystemType,
        surface: AppSurface,
        options?: { newTabForPage?: boolean }
    ) => {
        if (!isSystemAppId(appId)) {
            if (surface === "modal") {
                setActiveSystemDialog(appId);
            }
            return;
        }

        if (!supportsSurface(appId, surface)) {
            return;
        }

        if (surface === "modal") {
            preloadModalRuntime(appId);
            setActiveSystemDialog(appId);
            return;
        }

        if (surface === "sidebar") {
            setActiveSystemDialog(null);
            void openBrowserSidePanel(appId);
            return;
        }

        const manifest = getAppManifestItem(appId);
        if (!manifest?.pagePath) {
            return;
        }

        setActiveSystemDialog(null);
        const target = `#${manifest.pagePath}`;
        window.open(target, options?.newTabForPage === false ? "_self" : "_blank");
    }, [setActiveSystemDialog]);

    const launchApp = useCallback((
        appId: SystemType,
        options?: LaunchAppOptions
    ) => {
        if (!isSystemAppId(appId)) {
            setActiveSystemDialog(appId);
            return;
        }

        const launch = resolveLaunchTarget(appId, {
            ctrlKey: options?.ctrlKey,
            metaKey: options?.metaKey,
            altKey: options?.altKey,
        });

        if (launch.surface === "page") {
            const target = launch.pagePath ? `#${launch.pagePath}` : "#/";
            setActiveSystemDialog(null);
            window.open(target, options?.newTabForPage === false ? "_self" : "_blank");
            return;
        }

        if (launch.surface === "sidebar") {
            setActiveSystemDialog(null);
            void openBrowserSidePanel(appId);
            return;
        }

        preloadModalRuntime(appId);
        setActiveSystemDialog(appId);
    }, [setActiveSystemDialog]);

    return {
        launchApp,
        launchToSurface,
    };
}


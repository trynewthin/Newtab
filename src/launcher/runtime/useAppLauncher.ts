import { useCallback } from "react";
import { useUIStore } from "@/launcher/store/ui.store";
import type { SystemType } from "@/launcher/registry/appManifest";
import { preloadModalRuntime } from "./appRuntimeRegistry";
import {
    type AppSurface,
    getAppManifestItem,
    isSystemAppId,
    resolveLaunchTarget,
    supportsSurface,
} from "@/launcher/registry/appManifest";

export interface LaunchAppOptions {
    ctrlKey?: boolean;
    metaKey?: boolean;
    newTabForPage?: boolean;
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

        const manifest = getAppManifestItem(appId);
        if (!manifest) {
            // Blocked or unknown app: ignore launch request.
            return;
        }

        const launch = resolveLaunchTarget(appId, {
            ctrlKey: options?.ctrlKey,
            metaKey: options?.metaKey,
        });

        if (launch.surface === "page") {
            const target = launch.pagePath ? `#${launch.pagePath}` : "#/";
            setActiveSystemDialog(null);
            window.open(target, options?.newTabForPage === false ? "_self" : "_blank");
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


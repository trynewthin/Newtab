import { createContext, useContext } from "react";
import type { AppSurface } from "@/shared/types";
import type { SystemAppId } from "@/launcher/registry/appManifest";
import { supportsSurface } from "@/launcher/registry/appManifest";

export interface AppSurfaceBridge {
    appId: SystemAppId;
    surface: AppSurface;
    supports: (target: AppSurface) => boolean;
    openSurface: (target: AppSurface, options?: { newTabForPage?: boolean }) => void;
    close: () => void;
}

export const AppSurfaceBridgeContext = createContext<AppSurfaceBridge | null>(null);

export function useAppSurfaceBridge() {
    const bridge = useContext(AppSurfaceBridgeContext);
    if (!bridge) {
        throw new Error("useAppSurfaceBridge must be used within AppSurfaceBridgeProvider");
    }
    return bridge;
}

export function useOptionalAppSurfaceBridge() {
    return useContext(AppSurfaceBridgeContext);
}

export function createAppSurfaceBridge(
    appId: SystemAppId,
    surface: AppSurface,
    launchToSurface: (
        appId: SystemAppId,
        surface: AppSurface,
        options?: { newTabForPage?: boolean }
    ) => void,
    close: () => void
): AppSurfaceBridge {
    return {
        appId,
        surface,
        supports: (target) => supportsSurface(appId, target),
        openSurface: (target, options) => launchToSurface(appId, target, options),
        close,
    };
}

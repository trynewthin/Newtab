import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import type { AppSurface, SystemAppId } from "./appManifest";
import { supportsSurface } from "./appManifest";

export interface AppSurfaceBridge {
    appId: SystemAppId;
    surface: AppSurface;
    supports: (target: AppSurface) => boolean;
    openSurface: (target: AppSurface, options?: { newTabForPage?: boolean }) => void;
    close: () => void;
}

const AppSurfaceBridgeContext = createContext<AppSurfaceBridge | null>(null);

interface AppSurfaceBridgeProviderProps {
    value: AppSurfaceBridge;
    children: ReactNode;
}

export function AppSurfaceBridgeProvider({ value, children }: AppSurfaceBridgeProviderProps) {
    return (
        <AppSurfaceBridgeContext.Provider value={value}>
            {children}
        </AppSurfaceBridgeContext.Provider>
    );
}

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

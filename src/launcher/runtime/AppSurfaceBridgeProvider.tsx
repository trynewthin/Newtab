import type { ReactNode } from "react";
import type { AppSurfaceBridge } from "@/launcher/runtime/appSurfaceBridge";
import { AppSurfaceBridgeContext } from "@/launcher/runtime/appSurfaceBridge";

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

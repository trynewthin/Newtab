import { Suspense, useMemo } from "react";
import { getSidebarRenderer } from "@/apps/launcher/system/appRuntimeRegistry";
import { createAppSurfaceBridge, AppSurfaceBridgeProvider } from "@/apps/launcher/system/appSurfaceBridge";
import { getAppSurfaceFramePreset, isSystemAppId, type SystemAppId, supportsSurface } from "@/apps/launcher/system/appManifest";
import { useAppLauncher } from "@/apps/launcher/system/useAppLauncher";

const FALLBACK_APP: SystemAppId = "ai";

function resolveSidepanelApp(): SystemAppId {
    if (typeof window === "undefined") {
        return FALLBACK_APP;
    }

    const params = new URLSearchParams(window.location.search);
    const app = params.get("app");

    if (!app || !isSystemAppId(app) || !supportsSurface(app, "sidebar")) {
        return FALLBACK_APP;
    }

    return app;
}

function App() {
    const appId = resolveSidepanelApp();
    const Renderer = getSidebarRenderer(appId);
    const { launchToSurface } = useAppLauncher();

    const bridge = useMemo(() => createAppSurfaceBridge(
        appId,
        "sidebar",
        launchToSurface,
        () => undefined
    ), [appId, launchToSurface]);

    if (!Renderer) {
        return (
            <div className="h-screen w-screen flex items-center justify-center text-muted-foreground">
                Side Panel App Not Available
            </div>
        );
    }

    return (
        <Suspense fallback={<div className="h-screen w-screen bg-background/60" />}>
            <AppSurfaceBridgeProvider value={bridge}>
                <Renderer
                    onClose={() => undefined}
                    appId={appId}
                    framePreset={getAppSurfaceFramePreset(appId, "sidebar")}
                />
            </AppSurfaceBridgeProvider>
        </Suspense>
    );
}

export default App;


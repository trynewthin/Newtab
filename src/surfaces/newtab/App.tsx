import { lazy, Suspense, useEffect } from "react";
import {
    getOnboardingRoute,
    isOnboardingRoute,
    useOnboardingStateStore,
} from "@/config";
import { useEntryEnvironmentSync } from "@/platform/bootstrap";
import { AppRouter } from "./AppRouter";
import { BackgroundLayer } from "./layers/BackgroundLayer";
import { FloatLayer } from "./layers/FloatLayer";
import { ModalLayer } from "./layers/ModalLayer";
import { Toaster } from "@/components/ui/sonner";
import { HashRouter, useLocation, useNavigate } from "react-router-dom";
import { useUIStore } from "@/launcher/store";
import { cn } from "@/shared/utils";
import { NEWTAB_LAYER_Z_INDEX } from "@/shared/constants/layerZIndex";
import { parseSystemDialogRoute, useSystemDialogRouter } from "@/launcher/store";
import { AppModalLoadingFallback } from "@/platform/ui";

const OnboardingDialog = lazy(() =>
    import("@/apps/onboarding/OnboardingDialog").then((m) => ({ default: m.OnboardingDialog }))
);

function AppShell() {
    useEntryEnvironmentSync();
    useSystemDialogRouter();

    const activeSystemDialog = useUIStore((state) => state.activeSystemDialog);
    const isModalVisible = activeSystemDialog !== null;
    const hasCompletedOnboarding = useOnboardingStateStore((state) => state.hasCompletedOnboarding);
    const location = useLocation();
    const navigate = useNavigate();
    const isModalRoute = parseSystemDialogRoute(location.pathname) !== null;
    const onboardingRouteActive = isOnboardingRoute(location.pathname);
    const shouldBlockDashboard = isModalRoute || onboardingRouteActive || !hasCompletedOnboarding;

    useEffect(() => {
        if (!hasCompletedOnboarding && !onboardingRouteActive) {
            navigate(getOnboardingRoute(), { replace: true });
            return;
        }

        if (hasCompletedOnboarding && onboardingRouteActive) {
            navigate("/", { replace: true });
        }
    }, [hasCompletedOnboarding, navigate, onboardingRouteActive]);

    return (
        <div className="relative w-full h-full overflow-hidden">
            <BackgroundLayer />
            {!shouldBlockDashboard ? (
                <>
                    <div
                        style={{ zIndex: NEWTAB_LAYER_Z_INDEX.content }}
                        className={cn(
                            "relative w-full h-full transition-opacity duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                            isModalVisible && "pointer-events-none"
                        )}
                    >
                        <AppRouter />
                    </div>
                    <div
                        className={cn(
                            "transition-opacity duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                            isModalVisible && "pointer-events-none"
                        )}
                    >
                        <FloatLayer />
                    </div>
                </>
            ) : null}
            {(!hasCompletedOnboarding || onboardingRouteActive) ? (
                <Suspense fallback={<AppModalLoadingFallback fullscreen />}>
                    <OnboardingDialog open onOpenChange={() => {}} />
                </Suspense>
            ) : null}
            <ModalLayer />
            <Toaster />
        </div>
    );
}

export function App() {
    return (
        <HashRouter>
            <AppShell />
        </HashRouter>
    );
}

export default App;

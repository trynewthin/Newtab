import { lazy, Suspense, useEffect, useState } from "react";
import { AppGrid } from "@/launcher";
import { cn } from "@/shared/utils";
import { useUIStore } from "@/launcher/store/ui.store";
import { useSystemDialogRouter } from "@/launcher/store/useSystemDialogRouter";
import { warmupModalRuntimes } from "@/launcher/runtime/appRuntimeRegistry";
import { LAYER_Z_INDEX } from "@/shared/constants/layerZIndex";
import { useSettingsStore } from "@/apps/settings";

const HomeTools = lazy(() =>
    import("@/launcher/ui/dialogs/HomeTools").then((m) => ({ default: m.HomeTools }))
);
const OnboardingDialog = lazy(() =>
    import("@/apps/onboarding/OnboardingDialog").then((m) => ({ default: m.OnboardingDialog }))
);

const DASHBOARD_GRID_TOP_INSET_PX = 168;
const TOOLBAR_TRIGGER_TOP_PX = 64;
const TOOLBAR_TRIGGER_HALF_WIDTH_PX = 320;

export function DashboardView() {
    useSystemDialogRouter();

    const [showTools, setShowTools] = useState(false);
    const [supportsHoverReveal, setSupportsHoverReveal] = useState(false);
    const [isNearTop, setIsNearTop] = useState(false);
    const [isToolbarHovered, setIsToolbarHovered] = useState(false);

    const isFirstRun = useSettingsStore((state) => state.isFirstRun);
    const showOnboarding = isFirstRun;
    const isModalVisible = useUIStore((state) => state.activeSystemDialog !== null);
    const isFolderPreviewVisible = useUIStore((state) => state.isFolderPreviewVisible);

    useEffect(() => {
        if (typeof window === "undefined") {
            return;
        }

        const trigger = () => setShowTools(true);
        let cleanup: (() => void) | null = null;
        const win = window as Window & {
            requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
            cancelIdleCallback?: (id: number) => void;
        };

        if (
            typeof win.requestIdleCallback === "function" &&
            typeof win.cancelIdleCallback === "function"
        ) {
            const id = win.requestIdleCallback(trigger, { timeout: 1000 });
            cleanup = () => win.cancelIdleCallback?.(id);
        } else {
            const id = globalThis.setTimeout(trigger, 800);
            cleanup = () => globalThis.clearTimeout(id);
        }

        return () => cleanup?.();
    }, []);

    useEffect(() => {
        if (!showTools || typeof window === "undefined") {
            return;
        }

        const mediaQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
        const updateSupport = () => setSupportsHoverReveal(mediaQuery.matches);
        updateSupport();

        mediaQuery.addEventListener?.("change", updateSupport);
        return () => mediaQuery.removeEventListener?.("change", updateSupport);
    }, [showTools]);

    useEffect(() => {
        if (typeof window === "undefined") {
            return;
        }

        let cleanup: (() => void) | null = null;
        const win = window as Window & {
            requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
            cancelIdleCallback?: (id: number) => void;
        };
        const warmup = () => warmupModalRuntimes();

        if (
            typeof win.requestIdleCallback === "function" &&
            typeof win.cancelIdleCallback === "function"
        ) {
            const id = win.requestIdleCallback(warmup, { timeout: 2000 });
            cleanup = () => win.cancelIdleCallback?.(id);
        } else {
            const id = globalThis.setTimeout(warmup, 1200);
            cleanup = () => globalThis.clearTimeout(id);
        }

        return () => cleanup?.();
    }, []);

    useEffect(() => {
        if (
            !showTools ||
            !supportsHoverReveal ||
            isModalVisible ||
            isFolderPreviewVisible ||
            typeof window === "undefined"
        ) {
            return;
        }

        let rafId = 0;
        const onMouseMove = (event: MouseEvent) => {
            if (rafId) {
                window.cancelAnimationFrame(rafId);
            }
            const isNearTopEdge = event.clientY <= TOOLBAR_TRIGGER_TOP_PX;
            const isNearCenterX =
                Math.abs(event.clientX - window.innerWidth / 2) <= TOOLBAR_TRIGGER_HALF_WIDTH_PX;
            const nextNearTop = isNearTopEdge && isNearCenterX;
            rafId = window.requestAnimationFrame(() => setIsNearTop(nextNearTop));
        };
        const onMouseLeaveWindow = () => setIsNearTop(false);

        window.addEventListener("mousemove", onMouseMove, { passive: true });
        window.addEventListener("mouseleave", onMouseLeaveWindow);

        return () => {
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mouseleave", onMouseLeaveWindow);
            if (rafId) {
                window.cancelAnimationFrame(rafId);
            }
        };
    }, [showTools, supportsHoverReveal, isModalVisible, isFolderPreviewVisible]);

    const toolbarVisible =
        showTools &&
        !isModalVisible &&
        !isFolderPreviewVisible &&
        (!supportsHoverReveal || isNearTop || isToolbarHovered);

    return (
        <div className="w-full h-full pointer-events-auto relative py-0 px-0 flex flex-col items-center overflow-visible">
            {showTools && (
                <div
                    style={{ zIndex: LAYER_Z_INDEX.newtabToolbar }}
                    className={cn(
                        "absolute inset-x-0 top-0 flex justify-center pt-2",
                        toolbarVisible ? "pointer-events-auto" : "pointer-events-none"
                    )}
                >
                    <div
                        className={cn(
                            "will-change-transform transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                            toolbarVisible ? "translate-y-0" : "-translate-y-[120%]"
                        )}
                        onMouseEnter={() => setIsToolbarHovered(true)}
                        onMouseLeave={() => setIsToolbarHovered(false)}
                        onFocusCapture={() => setIsToolbarHovered(true)}
                        onBlurCapture={(event) => {
                            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                                setIsToolbarHovered(false);
                            }
                        }}
                    >
                        <div className="flex gap-2 pointer-events-auto">
                            <Suspense fallback={null}>
                                <HomeTools />
                            </Suspense>
                        </div>
                    </div>
                </div>
            )}

            <div
                className="relative w-full h-full min-h-0 overflow-visible"
                style={{ zIndex: LAYER_Z_INDEX.newtabContentOverlay }}
            >
                <AppGrid topInsetPx={DASHBOARD_GRID_TOP_INSET_PX} />
            </div>

            {showOnboarding && (
                <Suspense fallback={null}>
                    <OnboardingDialog open={showOnboarding} onOpenChange={() => {}} />
                </Suspense>
            )}
        </div>
    );
}

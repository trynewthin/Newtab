import { lazy, Suspense, useEffect, useState } from "react";
import { BasePage } from "@/platform/shared/layout";
import { AppGrid } from "@/apps/launcher";
import { motion } from "framer-motion";
import { useSystemDialogRouter } from "@/apps/launcher/store/ui";
import { warmupModalRuntimes } from "@/apps/launcher/system/appRuntimeRegistry";
import { LAYER_Z_INDEX } from "@/platform/core/layerZIndex";

const HomeTools = lazy(() =>
    import("@/apps/launcher/components/HomeTools").then((m) => ({ default: m.HomeTools }))
);
const DASHBOARD_GRID_TOP_INSET_PX = 168;

export function DashboardView() {
    // Enable hash routing for system dialogs
    useSystemDialogRouter();
    const [showTools, setShowTools] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const trigger = () => setShowTools(true);
        let cleanup: (() => void) | null = null;
        const win = window as Window & {
            requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
            cancelIdleCallback?: (id: number) => void;
        };

        if (typeof win.requestIdleCallback === "function" && typeof win.cancelIdleCallback === "function") {
            const id = win.requestIdleCallback(trigger, { timeout: 1000 });
            cleanup = () => {
                win.cancelIdleCallback?.(id);
            };
        } else {
            const id = globalThis.setTimeout(trigger, 800);
            cleanup = () => globalThis.clearTimeout(id);
        }

        return () => cleanup?.();
    }, []);

    useEffect(() => {
        if (typeof window === "undefined") return;

        let cleanup: (() => void) | null = null;
        const win = window as Window & {
            requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
            cancelIdleCallback?: (id: number) => void;
        };

        const warmup = () => warmupModalRuntimes();

        if (typeof win.requestIdleCallback === "function" && typeof win.cancelIdleCallback === "function") {
            const id = win.requestIdleCallback(warmup, { timeout: 2000 });
            cleanup = () => {
                win.cancelIdleCallback?.(id);
            };
        } else {
            const id = globalThis.setTimeout(warmup, 1200);
            cleanup = () => globalThis.clearTimeout(id);
        }

        return () => cleanup?.();
    }, []);

    return (
        <BasePage
            className="py-0 px-0 flex h-full flex-col items-center relative overflow-visible"
            tools={showTools ? (
                <Suspense fallback={null}>
                    <HomeTools />
                </Suspense>
            ) : null}
        >
            {/* Content Layer */}
            <motion.div
                key="content-grid"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="relative w-full h-full min-h-0 overflow-visible"
                style={{ zIndex: LAYER_Z_INDEX.newtabContentOverlay }}
            >
                <AppGrid topInsetPx={DASHBOARD_GRID_TOP_INSET_PX} />
            </motion.div>
        </BasePage>
    );
}


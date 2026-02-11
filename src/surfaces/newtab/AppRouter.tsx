import { Suspense, lazy } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { DashboardView } from "@/surfaces/newtab/pages/DashboardView";
import { AnimatePresence } from "framer-motion";
import { getSystemPageRoutes } from "@/apps/launcher/system/appManifest";
import { getPageRenderer } from "@/apps/launcher/system/appRuntimeRegistry";

const AiSearchView = lazy(() =>
    import("@/surfaces/newtab/pages/AiSearchView").then((m) => ({ default: m.AiSearchView }))
);

function RouteFallback() {
    return <div className="w-full h-full bg-background" />;
}

export function AppRouter() {
    const location = useLocation();

    return (
        <AnimatePresence mode="wait" initial={false}>
            <Routes location={location} key={location.pathname}>
                <Route path="/" element={<DashboardView />} />
                <Route
                    path="/search"
                    element={
                        <Suspense fallback={<RouteFallback />}>
                            <AiSearchView />
                        </Suspense>
                    }
                />
                {getSystemPageRoutes().map((route) => {
                    const PageRenderer = getPageRenderer(route.appId);
                    if (!PageRenderer) return null;
                    return (
                        <Route
                            key={route.path}
                            path={route.path}
                            element={
                                <Suspense fallback={<RouteFallback />}>
                                    <PageRenderer appId={route.appId} />
                                </Suspense>
                            }
                        />
                    );
                })}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </AnimatePresence>
    );
}


import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { DashboardView } from "@/newtab/pages/DashboardView";
import { AiSearchView } from "@/newtab/pages/AiSearchView";
import { AnimatePresence } from "framer-motion";

export function AppRouter() {
    const location = useLocation();

    return (
        <AnimatePresence mode="wait" initial={false}>
            <Routes location={location} key={location.pathname}>
                <Route path="/" element={<DashboardView />} />
                <Route path="/search" element={<AiSearchView />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </AnimatePresence>
    );
}

import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { DashboardView } from "@/newtab/pages/DashboardView";
import { AiSearchView } from "@/newtab/pages/AiSearchView";

export function AppRouter() {
    return (
        <HashRouter>
            <Routes>
                <Route path="/" element={<DashboardView />} />
                <Route path="/search" element={<AiSearchView />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </HashRouter>
    );
}

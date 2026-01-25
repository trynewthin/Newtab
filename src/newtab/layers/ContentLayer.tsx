import { Routes, Route } from "react-router-dom";
import { DashboardView } from "../pages/DashboardView";
export function ContentLayer() {
    return (
        <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden">
            <Routes>
                <Route path="/" element={<DashboardView />} />
            </Routes>
        </div>
    );
}

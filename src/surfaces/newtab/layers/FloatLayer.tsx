import { SearchBar } from "@/apps/search";
import { useLocation } from "react-router-dom";
import { NEWTAB_LAYER_Z_INDEX } from "@/shared/constants/layerZIndex";

export function FloatLayer() {
    const location = useLocation();
    const isDashboard = location.pathname === "/";

    return (
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: NEWTAB_LAYER_Z_INDEX.floating }}>
            {isDashboard && (
                <div className="mx-auto w-full max-w-2xl px-4 pt-24 pointer-events-none">
                    <div className="pointer-events-auto">
                        <SearchBar />
                    </div>
                </div>
            )}
        </div>
    );
}

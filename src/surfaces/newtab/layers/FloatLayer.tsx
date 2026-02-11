import { SearchBar } from "@/apps/search/components/SearchBar";
import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import { useUIStore } from "@/apps/launcher/store/ui";

export function FloatLayer() {
    const location = useLocation();
    const isDashboard = location.pathname === "/";
    const isFolderPreviewVisible = useUIStore((state) => state.isFolderPreviewVisible);

    return (
        <div className="absolute inset-0 z-40 pointer-events-none">
            {isDashboard && !isFolderPreviewVisible && (
                <div className="mx-auto w-full max-w-2xl px-4 pt-24 pointer-events-none">
                    <motion.div
                        className="pointer-events-auto"
                        initial={{ y: 200, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -50, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    >
                        <SearchBar />
                    </motion.div>
                </div>
            )}
        </div>
    );
}

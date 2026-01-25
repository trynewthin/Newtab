import { SearchBar } from "@/features/search/components/SearchBar";
import { BasePage } from "@/shared/layout";
import { AppGrid } from "@/features/launcher";
import { HomeTools } from "@/features/launcher/components/HomeTools";
import { motion } from "framer-motion";
import { useSystemDialogRouter } from "@/features/launcher/store/ui";

export function DashboardView() {
    // Enable hash routing for system dialogs
    useSystemDialogRouter();

    return (
        <BasePage className="py-0 px-0 flex flex-col items-center relative overflow-hidden" tools={<HomeTools />}>
            {/* 1. Search Area */}
            <motion.div
                initial={{ y: 200, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -50, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="w-full max-w-2xl px-4 z-50 flex flex-col items-center mt-32"
            >
                <SearchBar />
            </motion.div>

            {/* 2. Main Content (App Grid) */}
            <motion.div
                key="content-grid"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="w-full flex-1 min-h-0 overflow-hidden mt-6"
            >
                <AppGrid />
            </motion.div>
        </BasePage>
    );
}

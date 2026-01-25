import { SearchBar } from "@/components/home/SearchBar";
import { BasePage } from "@/components/layout";
import { AppGrid } from "@/apps/core";
import { HomeTools } from "@/components/home/HomeTools";
import { motion } from "framer-motion";

export function DashboardView() {
    return (
        <BasePage className="py-0 px-0 flex flex-col items-center relative overflow-hidden" tools={<HomeTools />}>
            {/* 1. Search Area */}
            <motion.div
                layout
                initial={false}
                animate={{
                    marginTop: "8rem",
                    width: "100%",
                    maxWidth: "56rem"
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="w-full shrink-0 px-4 z-50 flex flex-col items-center"
            >
                <SearchBar />
            </motion.div>

            {/* 2. Main Content (App Grid) */}
            <motion.div
                key="content-grid"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
                transition={{ duration: 0.3 }}
                className="w-full flex-1 min-h-0 overflow-hidden mt-6"
            >
                <AppGrid />
            </motion.div>
        </BasePage>
    );
}

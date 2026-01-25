import { useEffect, useRef } from "react";
import { SearchBar } from "@/components/home/SearchBar";
import { BasePage } from "@/components/layout";
import { motion, AnimatePresence } from "framer-motion";
import { StopCircle } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useAiSearch } from "@/components/ai/useAiSearch";
import { AiSearchResults } from "@/components/ai/AiSearchResults";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

export function AiSearchView() {
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();
    const initialQuery = searchParams.get("q") || "";

    const { status, progressMessage, response, error, search, cancel, isLoading } = useAiSearch();

    // Track if we've already triggered a search for this query
    const triggeredQueryRef = useRef<string | null>(null);

    // Trigger AI search when query changes
    useEffect(() => {
        const trimmedQuery = initialQuery.trim();

        // Skip if no query or already triggered
        if (!trimmedQuery || triggeredQueryRef.current === trimmedQuery) {
            return;
        }

        // Mark this query as triggered
        triggeredQueryRef.current = trimmedQuery;

        // Start search
        search(trimmedQuery);
    }, [initialQuery, search]);

    return (
        <BasePage className="py-0 px-0 flex flex-col items-center relative h-screen overflow-hidden bg-background">
            {/* 1. Results Area (Main Content - Top) */}
            <motion.div
                key="ai-result-area"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full h-full overflow-y-auto scrollbar-none pt-6 pb-60 px-4 max-w-4xl mx-auto relative z-10"
            >
                <AiSearchResults
                    status={status}
                    cards={response?.cards || []}
                    summary={response?.summary}
                    error={error}
                    className="pb-8"
                />
            </motion.div>

            {/* 2. Fixed Control Center (Centered at Middle-Bottom) */}
            <div className="fixed bottom-0 left-0 right-0 pointer-events-none flex flex-col items-center gap-6 pb-12 z-50">

                {/* centered Stop Button Area (Above Search Bar) */}
                <div className="h-12 flex items-center justify-center">
                    <AnimatePresence>
                        {isLoading && (
                            <motion.div
                                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.8 }}
                                className="pointer-events-auto"
                            >
                                <button
                                    onClick={cancel}
                                    className="relative group flex items-center gap-2.5 px-4 py-2 rounded-full bg-background/80 backdrop-blur-md text-foreground font-semibold shadow-xl border border-border/50 transition-all hover:scale-105 active:scale-95 overflow-hidden"
                                >
                                    {/* Rotating Border Glow (Surrounding Light) */}
                                    <div className="absolute inset-[-200%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_0deg,transparent_60%,var(--color-primary),transparent_100%)] opacity-40 group-hover:opacity-100 transition-opacity" />

                                    {/* Inner Background to keep content crisp */}
                                    <div className="absolute inset-px bg-background/90 rounded-full z-0" />

                                    <div className="relative z-10 flex items-center gap-2">
                                        <div className="relative">
                                            <StopCircle size={18} className="text-destructive" />
                                            <motion.div
                                                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                                                transition={{ repeat: Infinity, duration: 2 }}
                                                className="absolute inset-0 bg-destructive/30 rounded-full -z-10"
                                            />
                                        </div>
                                        <span className="text-sm tracking-tight text-foreground max-w-[200px] truncate">
                                            {progressMessage || t('stop_search')}
                                        </span>
                                    </div>
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Main Search Bar Container */}
                <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 25 }}
                    className="w-full max-w-2xl px-4 pointer-events-auto"
                >
                    <div className="relative">
                        <SearchBar initialQuery={initialQuery} isAiMode={true} />
                    </div>
                </motion.div>
            </div>

            {/* 3. Professional Dynamic Aurora Clouds (No Sharp Edges) */}
            <div
                className="fixed inset-x-0 bottom-0 h-[35vh] pointer-events-none z-40 overflow-visible"
                style={{
                    maskImage: 'linear-gradient(to top, black 20%, transparent 100%)',
                    WebkitMaskImage: 'linear-gradient(to top, black 20%, transparent 100%)'
                }}
            >
                {/* Atmosphere Layer - Smoothes background transition */}
                <div className="absolute inset-0 bg-linear-to-t from-background via-background/60 to-transparent z-10" />

                {/* Moving Light Orbs */}
                <div className={cn(
                    "absolute inset-0 transition-all duration-1000 mix-blend-screen dark:mix-blend-lighten",
                    isLoading ? "opacity-100 scale-110" : "opacity-30 scale-100"
                )}>
                    {/* Orb 1: Cyan/Primary */}
                    <motion.div
                        animate={{
                            x: isLoading ? [-200, 200, -200] : [-100, 100, -100],
                            y: [0, 100, 0],
                            scale: [1, 1.5, 1],
                        }}
                        transition={{
                            duration: isLoading ? 8 : 20,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                        className="absolute bottom-[-10%] left-[10%] w-[500px] h-[500px] bg-primary/30 rounded-full blur-[120px]"
                    />

                    {/* Orb 2: Purple/Indigo */}
                    <motion.div
                        animate={{
                            x: isLoading ? [200, -200, 200] : [100, -100, 100],
                            y: [50, -50, 50],
                            scale: [1.2, 0.8, 1.2],
                        }}
                        transition={{
                            duration: isLoading ? 10 : 25,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                        className="absolute bottom-[-15%] right-[15%] w-[600px] h-[600px] bg-indigo-500/25 rounded-full blur-[140px]"
                    />

                    {/* Orb 3: Success/Green (Energy Surge during load) */}
                    <motion.div
                        animate={{
                            y: isLoading ? [150, 0, 150] : [200, 150, 200],
                            opacity: isLoading ? [0.2, 0.5, 0.2] : 0,
                        }}
                        transition={{
                            duration: 6,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-emerald-400/15 rounded-full blur-[100px]"
                    />
                </div>
            </div>

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </BasePage>
    );
}

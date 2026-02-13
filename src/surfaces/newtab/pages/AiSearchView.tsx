import { useEffect, useRef } from "react";
import { SearchBar } from "@/apps/search/components/SearchBar";
import { BasePage } from "@/components/layout";
import { motion, AnimatePresence } from "framer-motion";
import { StopCircle } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useAiSearch } from "@/apps/ai-search/hooks/useAiSearch";
import { AiSearchResults } from "@/apps/ai-search/components/AiSearchResults";
import { cn } from "@/core/utils";
import { useTranslation } from "react-i18next";
import GradualBlur from "@/components/GradualBlur";
import AppSurface from "@/components/surface/AppSurface";
import { LAYER_Z_INDEX } from "@/core/layerZIndex";

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
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full h-full"
        >
            <BasePage className="py-0 px-0 flex flex-col items-center relative h-screen overflow-hidden">
                {/* 1. Results Area (Main Content - Top) */}
                <motion.section
                    key="ai-result-area"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="w-full h-full max-w-4xl mx-auto relative overflow-hidden"
                    style={{ zIndex: LAYER_Z_INDEX.newtabContent }}
                >
                    <div className="w-full h-full overflow-y-auto scrollbar-none pt-24 pb-60 px-4">
                        <AiSearchResults
                            status={status}
                            cards={response?.cards || []}
                            summary={response?.summary}
                            error={error}
                            className="pb-8"
                        />
                    </div>

                    <GradualBlur
                        target="page"
                        position="top"
                        height="6rem"
                        strength={2}
                        divCount={5}
                        curve="bezier"
                        exponential
                        opacity={1}
                        zIndex={LAYER_Z_INDEX.newtabFloating}
                    />

                    <GradualBlur
                        target="page"
                        position="bottom"
                        height="7rem"
                        strength={2}
                        divCount={5}
                        curve="bezier"
                        exponential
                        opacity={1}
                        zIndex={LAYER_Z_INDEX.newtabFloating}
                    />
                </motion.section>

                {/* 2. Fixed Control Center (Centered at Middle-Bottom) */}
                <div
                    className="fixed bottom-0 left-0 right-0 pointer-events-none flex flex-col items-center gap-6 pb-12"
                    style={{ zIndex: LAYER_Z_INDEX.newtabToolbar }}
                >

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
                                        className="group relative flex items-center gap-2.5 overflow-hidden rounded-full border border-border/70 px-4 py-2 font-semibold text-foreground shadow-lg transition-all hover:scale-105 active:scale-95"
                                    >
                                        <div className="absolute inset-0 pointer-events-none">
                                            <AppSurface
                                                variant="base"
                                                width="100%"
                                                height="100%"
                                                borderRadius={999}
                                                className="h-full w-full"
                                            />
                                        </div>

                                        <div className="relative z-10 flex items-center gap-2">
                                            <div className="relative">
                                                <StopCircle size={18} className="text-foreground/85" />
                                                <motion.div
                                                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                                                    transition={{ repeat: Infinity, duration: 2 }}
                                                    className="absolute inset-0 -z-10 rounded-full bg-foreground/20"
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
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 200, damping: 25 }}
                        className="w-full max-w-2xl px-4 pointer-events-auto"
                    >
                        <div className="relative">
                            <SearchBar initialQuery={initialQuery} isAiMode={true} />
                        </div>
                    </motion.div>
                </div>

                {/* 3. Professional Dynamic Aurora Clouds (No Sharp Edges) */}
                <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="fixed inset-x-0 bottom-0 h-[35vh] pointer-events-none overflow-visible"
                    style={{ zIndex: LAYER_Z_INDEX.newtabFloating }}
                >
                    {/* Moving Light Orbs */}
                    <div className={cn(
                        "absolute inset-0 transition-all duration-1000 mix-blend-screen dark:mix-blend-lighten",
                        isLoading ? "opacity-100 scale-110" : "opacity-30 scale-100"
                    )}>
                        {/* Orb 1 */}
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
                            className="absolute bottom-[-10%] left-[10%] h-[500px] w-[500px] rounded-full bg-foreground/18 blur-[120px]"
                        />

                        {/* Orb 2 */}
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
                            className="absolute bottom-[-15%] right-[15%] h-[600px] w-[600px] rounded-full bg-foreground/15 blur-[140px]"
                        />

                        {/* Orb 3 */}
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
                            className="absolute bottom-0 left-1/2 h-[400px] w-[800px] -translate-x-1/2 rounded-full bg-foreground/10 blur-[100px]"
                        />
                    </div>
                </motion.div>
            </BasePage>
        </motion.div>
    );
}


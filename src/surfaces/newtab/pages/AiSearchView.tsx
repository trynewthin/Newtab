import { useCallback, useEffect, useRef, useState } from "react";
import { SearchBar } from "@/apps/search/components/SearchBar";
import { motion, AnimatePresence } from "framer-motion";
import { StopCircle } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAiSearch, AiSearchResults } from "@/apps/ai-search";
import { useTranslation } from "react-i18next";
import GradualBlur from "@/platform/ui/effects/GradualBlur";
import AppSurface from "@/platform/ui/surface/AppSurface";
import { LAYER_Z_INDEX } from "@/shared/constants/layerZIndex";

export function AiSearchView() {
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();
    const initialQuery = searchParams.get("q") || "";

    const { status, progressMessage, response, error, search, cancel, isLoading } = useAiSearch();
    const navigate = useNavigate();
    const [isExiting, setIsExiting] = useState(false);

    const handleExit = useCallback(() => {
        setIsExiting(true);
        cancel();
        setTimeout(() => navigate("/"), 150);
    }, [cancel, navigate]);

    const triggeredQueryRef = useRef<string | null>(null);

    useEffect(() => {
        const trimmedQuery = initialQuery.trim();
        if (!trimmedQuery || triggeredQueryRef.current === trimmedQuery) {
            return;
        }

        triggeredQueryRef.current = trimmedQuery;
        search(trimmedQuery);
    }, [initialQuery, search]);

    return (
        <div className="w-full h-full">
            <div className="py-0 px-0 flex flex-col items-center relative h-screen overflow-hidden w-full h-full">
                <div
                    className={`absolute inset-0 bg-background/40 modal-minimal-scope transition-opacity duration-150 ${
                        isExiting ? "opacity-0" : "opacity-100"
                    }`}
                />

                <section
                    className={`modal-minimal-scope w-full h-full max-w-4xl mx-auto relative overflow-hidden transition-all duration-150 ${
                        isExiting ? "opacity-0 scale-[0.98]" : "opacity-100 scale-100"
                    }`}
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
                </section>

                <div
                    className={`absolute inset-x-0 top-0 transition-opacity duration-150 ${
                        isExiting ? "opacity-0" : "opacity-100"
                    }`}
                    style={{ zIndex: LAYER_Z_INDEX.newtabFloating }}
                >
                    <GradualBlur
                        target="page"
                        position="top"
                        height="6rem"
                        strength={2}
                        divCount={5}
                        curve="bezier"
                        exponential
                        opacity={1}
                    />
                </div>
                <div
                    className={`absolute inset-x-0 bottom-0 transition-opacity duration-150 ${
                        isExiting ? "opacity-0" : "opacity-100"
                    }`}
                    style={{ zIndex: LAYER_Z_INDEX.newtabFloating }}
                >
                    <GradualBlur
                        target="page"
                        position="bottom"
                        height="7rem"
                        strength={2}
                        divCount={5}
                        curve="bezier"
                        exponential
                        opacity={1}
                    />
                </div>

                <div
                    className={`modal-minimal-scope fixed bottom-0 left-0 right-0 pointer-events-none flex flex-col items-center gap-6 pb-12 transition-all duration-150 ${
                        isExiting ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
                    }`}
                    style={{ zIndex: LAYER_Z_INDEX.newtabToolbar }}
                >
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
                                                    animate={{
                                                        scale: [1, 1.5, 1],
                                                        opacity: [0.5, 0, 0.5],
                                                    }}
                                                    transition={{ repeat: Infinity, duration: 2 }}
                                                    className="absolute inset-0 -z-10 rounded-full bg-foreground/20"
                                                />
                                            </div>
                                            <span className="text-sm tracking-tight text-foreground max-w-[200px] truncate">
                                                {progressMessage || t("stop_search")}
                                            </span>
                                        </div>
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 200, damping: 25 }}
                        className="w-full max-w-2xl px-4 pointer-events-auto"
                    >
                        <div className="relative">
                            <SearchBar
                                initialQuery={initialQuery}
                                isAiMode={true}
                                onExitAiMode={handleExit}
                            />
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}

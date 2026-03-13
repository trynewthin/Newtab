import { useState, useEffect, useRef } from "react";
import { Search, Sparkles, LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useSettingsStore } from "@/apps/settings/store";
import { cn } from "@/shared/utils";
import { useTranslation } from "react-i18next";
import { SEARCH_ENGINES } from "@/shared/constants";
import { useNavigate } from "react-router-dom";
import AppSurface from "@/platform/ui/surface/AppSurface";

interface SearchBarProps {
    initialQuery?: string;
    isAiMode?: boolean;
    onExitAiMode?: () => void;
}

export function SearchBar({ initialQuery = "", isAiMode = false, onExitAiMode }: SearchBarProps) {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [query, setQuery] = useState(initialQuery);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [engineMenuOpen, setEngineMenuOpen] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const searchEngine = useSettingsStore((state) => state.searchEngine);
    const setSearchEngine = useSettingsStore((state) => state.setSearchEngine);
    const customSearchEngines = useSettingsStore((state) => state.customSearchEngines);

    const containerRef = useRef<HTMLDivElement>(null);

    // Merge system and custom engines
    const allEngines = [...SEARCH_ENGINES, ...customSearchEngines];
    const currentEngine = allEngines.find(se => se.value === searchEngine) || allEngines[0];

    useEffect(() => {
        const fetchSuggestions = async () => {
            if (!query.trim() || isAiMode || engineMenuOpen) {
                setSuggestions([]);
                setShowSuggestions(false);
                return;
            }

            try {
                const response = await fetch(`https://suggestqueries.google.com/complete/search?client=chrome&q=${encodeURIComponent(query)}`);
                const data = await response.json();
                if (Array.isArray(data) && data[1]) {
                    setSuggestions(data[1].slice(0, 8));
                    setShowSuggestions(true);
                }
            } catch (error) {
                console.error('Failed to fetch suggestions:', error);
            }
        };

        const timer = setTimeout(fetchSuggestions, 200);
        return () => clearTimeout(timer);
    }, [query, isAiMode, engineMenuOpen]);

    useEffect(() => {
        const closeOverlays = () => {
            setShowSuggestions(false);
            setEngineMenuOpen(false);
        };

        const isOutsideContainer = (target: EventTarget | null) => {
            if (!containerRef.current) return true;
            if (!(target instanceof Node)) return true;
            return !containerRef.current.contains(target);
        };

        const handlePointerDown = (event: PointerEvent) => {
            if (isOutsideContainer(event.target)) {
                closeOverlays();
            }
        };

        const handleFocusIn = (event: FocusEvent) => {
            if (isOutsideContainer(event.target)) {
                closeOverlays();
            }
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                closeOverlays();
            }
        };

        document.addEventListener("pointerdown", handlePointerDown, true);
        document.addEventListener("focusin", handleFocusIn, true);
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("pointerdown", handlePointerDown, true);
            document.removeEventListener("focusin", handleFocusIn, true);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, []);

    const performSearch = (searchQuery: string) => {
        const trimmedQuery = searchQuery.trim();
        if (!trimmedQuery) return;

        // If we are already in AI mode and engine is AI, we might want to re-trigger search
        // This navigation will update the URL, and AiSearchView has a useEffect to trigger search on initialQuery change
        if (searchEngine === 'ai') {
            navigate(`/search?q=${encodeURIComponent(trimmedQuery)}&t=${Date.now()}`); // Adding timestamp to force trigger
            setShowSuggestions(false);
            setActiveIndex(-1);
            return;
        }

        // Standard Search Logic (Window Open)
        let searchUrl = currentEngine.url;
        if (searchUrl.includes('%s')) {
            searchUrl = searchUrl.replace('%s', encodeURIComponent(trimmedQuery));
        } else {
            searchUrl = searchUrl + encodeURIComponent(trimmedQuery);
        }

        window.open(searchUrl, '_blank', 'noopener,noreferrer');
        setQuery("");
        setShowSuggestions(false);
        setActiveIndex(-1);
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        performSearch(query);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!showSuggestions || suggestions.length === 0) return;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex(prev => (prev > -1 ? prev - 1 : prev));
        } else if (e.key === 'Enter' && activeIndex > -1) {
            e.preventDefault();
            performSearch(suggestions[activeIndex]);
        } else if (e.key === 'Escape') {
            setShowSuggestions(false);
        }
    };

    const handleEngineSelect = (value: string) => {
        setSearchEngine(value);
        if (isAiMode && value !== 'ai') {
            navigate('/');
        }
        setEngineMenuOpen(false);
    };

    const handleExitAiMode = () => {
        if (onExitAiMode) {
            onExitAiMode();
        } else {
            navigate('/');
        }
    };

    return (
        <div className="w-full relative group modal-minimal-scope" ref={containerRef}>
            <form onSubmit={handleSearch} className="relative z-30">
                {/* Main Pill Container */}
                <div className="relative h-12 md:h-14">
                    <div className="absolute inset-0 pointer-events-none">
                        <AppSurface variant="search-bar" className="h-full w-full" />
                    </div>

                    <div className={cn(
                        "relative z-10 flex gap-2 items-center h-full rounded-full px-3 transition-all duration-300"
                    )}>
                        {/* LEFT SIDE: Logic based on isAiMode */}
                        {isAiMode ? (
                            <button
                                type="button"
                                onClick={handleExitAiMode}
                                className="h-8 w-8 flex items-center justify-center cursor-pointer outline-none active:scale-90 transition-all text-[var(--text-surface-foreground)] shrink-0 rounded-full bg-transparent hover:opacity-80"
                                title={t("exit_ai_search")}
                            >
                                <LogOut size={16} />
                            </button>
                        ) : (
                            /* Engine Selector */
                            <div className="relative shrink-0">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setEngineMenuOpen((v) => {
                                            const next = !v;
                                            if (next) {
                                                setShowSuggestions(false);
                                            }
                                            return next;
                                        })
                                    }
                                    className="h-8 w-8 flex items-center justify-center cursor-pointer outline-none active:scale-90 transition-transform btn-no-style"
                                >
                                    {currentEngine.value === 'ai' ? (
                                        <Sparkles className="w-5.5 h-5.5 text-[var(--text-surface-foreground)]" strokeWidth={2.2} />
                                    ) : (
                                        <img
                                            src={currentEngine.icon}
                                            alt=""
                                            className="w-full h-full rounded-full object-contain"
                                        />
                                    )}
                                </button>
                                {engineMenuOpen && (
                                    <div className="absolute top-[calc(100%+16px)] left-[-6px] z-50 w-60 rounded-2xl border-2 border-border/75 shadow-[0_18px_45px_rgba(0,0,0,0.35)] overflow-hidden">
                                        <div className="absolute inset-0 pointer-events-none">
                                            <AppSurface
                                                variant="widget"
                                                style={{ outline: "none", border: "none", boxShadow: "none" }}
                                                className="h-full w-full"
                                            />
                                        </div>
                                        <div className="relative z-10 p-2">
                                            <div className="space-y-1 max-h-[400px] overflow-y-auto custom-scrollbar">
                                                {allEngines.map((engine) => (
                                                    <button
                                                        key={engine.value}
                                                        type="button"
                                                        onClick={() => handleEngineSelect(engine.value)}
                                                        className={cn(
                                                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 border-0 shadow-none outline-none",
                                                            engine.value === searchEngine
                                                                ? 'bg-foreground/16 text-foreground font-semibold'
                                                                : 'text-foreground hover:bg-foreground/12'
                                                        )}
                                                    >
                                                        <div className="w-5 h-5 flex items-center justify-center shrink-0">
                                                            {engine.value === 'ai' ? (
                                                                <Sparkles size={18} className="text-foreground" />
                                                            ) : (
                                                                <img src={engine.icon} alt="" className="w-4.5 h-4.5 rounded-sm object-contain" />
                                                            )}
                                                        </div>
                                                        <span className="text-sm font-medium">{engine.name}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex-1 h-full flex items-center">
                            <Input
                                type="text"
                                autoFocus
                                value={query}
                                onChange={(e) => {
                                    setQuery(e.target.value);
                                    setActiveIndex(-1);
                                }}
                                onKeyDown={handleKeyDown}
                                onFocus={() => {
                                    setEngineMenuOpen(false);
                                    if (query.trim()) {
                                        setShowSuggestions(true);
                                    }
                                }}
                                placeholder={isAiMode ? t("ask_or_search_anything") : t('search_placeholder')}
                                className="text-surface-input h-full w-full border-0 shadow-none px-0 py-0 text-base md:text-lg ring-0 focus-visible:ring-0 rounded-none font-medium"
                            />
                        </div>

                        {/* RIGHT SIDE: Action Buttons */}
                        <div className="flex items-center gap-1">
                            <button
                                type="submit"
                                className="h-8 w-8 flex items-center justify-center text-[var(--text-surface-foreground)] hover:opacity-80 transition-all active:scale-90"
                                title={isAiMode ? t("search_again") : t("search")}
                            >
                                <Search size={18} strokeWidth={2.5} />
                            </button>
                        </div>
                    </div>
                </div>
            </form>

            <style>{`
                .btn-no-style {
                    background: none;
                    border: none;
                    box-shadow: none;
                    padding: 0;
                }
            `}</style>

            {/* Suggestions - Minimalist */}
            {!isAiMode && !engineMenuOpen && showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-[calc(100%+8px)] z-40 left-0 right-0 rounded-3xl border-2 border-border/75 shadow-[0_18px_45px_rgba(0,0,0,0.35)] overflow-hidden">
                    <div className="absolute inset-0 pointer-events-none">
                        <AppSurface
                            variant="widget"
                            width="100%"
                            height="100%"
                            borderRadius={24}
                            style={{ outline: "none", border: "none", boxShadow: "none" }}
                            className="h-full w-full rounded-[24px]"
                        />
                    </div>
                    <div className="relative z-10 p-2">
                        <ul className="space-y-1">
                            {suggestions.map((suggestion, index) => (
                                <li
                                    key={index}
                                    onClick={() => performSearch(suggestion)}
                                    onMouseEnter={() => setActiveIndex(index)}
                                    className={cn(
                                        "px-4 py-3.5 rounded-2xl cursor-pointer flex items-center gap-3 transition-colors",
                                        index === activeIndex
                                            ? "bg-foreground/16 text-foreground"
                                            : "text-foreground hover:bg-foreground/12"
                                    )}
                                >
                                    <Search size={16} className={cn("shrink-0", index === activeIndex ? "opacity-100" : "opacity-30")} />
                                    <span className="text-base font-medium">{suggestion}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
}


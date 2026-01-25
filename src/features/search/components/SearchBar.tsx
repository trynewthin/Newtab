import { useState, useEffect, useRef } from "react";
import { Search, Sparkles, LogOut } from "lucide-react";
import { Input } from "@/shared/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { useSettingsStore } from "@/features/settings/store";
import { cn } from "@/core/utils";
import { useTranslation } from "react-i18next";
import { SEARCH_ENGINES } from "@/core/constants";
import { useNavigate } from "react-router-dom";

interface SearchBarProps {
    initialQuery?: string;
    isAiMode?: boolean;
}

export function SearchBar({ initialQuery = "", isAiMode = false }: SearchBarProps) {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [query, setQuery] = useState(initialQuery);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [open, setOpen] = useState(false);
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
            if (!query.trim() || isAiMode) {
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
    }, [query, isAiMode]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
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
        setOpen(false);
    };

    const handleExitAiMode = () => {
        navigate('/');
    };

    return (
        <div className="w-full relative group" ref={containerRef}>
            <form onSubmit={handleSearch} className="relative z-30">
                {/* Main Pill Container */}
                <div className={cn(
                    "flex gap-2 items-center rounded-full px-3 transition-all duration-300",
                    "bg-white/40 dark:bg-black/40 backdrop-blur-3xl border border-white/20 dark:border-white/10 shadow-2xl shadow-primary/10",
                    "h-12 md:h-14"
                )}>
                    {/* LEFT SIDE: Logic based on isAiMode */}
                    {isAiMode ? (
                        <button
                            type="button"
                            onClick={handleExitAiMode}
                            className="h-8 w-8 flex items-center justify-center cursor-pointer outline-none active:scale-90 transition-all text-muted-foreground hover:text-destructive shrink-0 border border-black/20 dark:border-white/20 rounded-full bg-black/5 dark:bg-white/5"
                            title="Exit AI Search"
                        >
                            <LogOut size={16} />
                        </button>
                    ) : (
                        /* Engine Selector */
                        <Popover open={open} onOpenChange={setOpen}>
                            <PopoverTrigger
                                className="h-8 w-8 flex items-center justify-center cursor-pointer outline-none active:scale-90 transition-transform btn-no-style"
                            >
                                {currentEngine.value === 'ai' ? (
                                    <Sparkles className="w-5.5 h-5.5 text-primary" strokeWidth={2.2} />
                                ) : (
                                    <img
                                        src={currentEngine.icon}
                                        alt=""
                                        className="w-full h-full rounded-full object-contain"
                                    />
                                )}
                            </PopoverTrigger>
                            <PopoverContent className="w-60 p-2 rounded-2xl bg-background/90 backdrop-blur-3xl border border-white/10 mt-2 overflow-hidden shadow-none" align="start">
                                <div className="space-y-1 max-h-[400px] overflow-y-auto custom-scrollbar">
                                    {allEngines.map((engine) => (
                                        <button
                                            key={engine.value}
                                            type="button"
                                            onClick={() => handleEngineSelect(engine.value)}
                                            className={cn(
                                                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 border-0 shadow-none outline-none",
                                                engine.value === searchEngine
                                                    ? 'bg-primary/20 text-primary font-bold'
                                                    : 'text-foreground hover:bg-white/5'
                                            )}
                                        >
                                            <div className="w-5 h-5 flex items-center justify-center shrink-0">
                                                {engine.value === 'ai' ? (
                                                    <Sparkles size={18} className="text-primary" />
                                                ) : (
                                                    <img src={engine.icon} alt="" className="w-4.5 h-4.5 rounded-sm object-contain" />
                                                )}
                                            </div>
                                            <span className="text-sm font-medium">{engine.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </PopoverContent>
                        </Popover>
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
                            onFocus={() => query.trim() && setShowSuggestions(true)}
                            placeholder={isAiMode ? "Ask or search anything..." : t('search_placeholder')}
                            className="text-foreground placeholder:text-foreground/30 font-medium"
                        />
                    </div>

                    {/* RIGHT SIDE: Action Buttons */}
                    <div className="flex items-center gap-1">
                        <button
                            type="submit"
                            className="h-8 w-8 flex items-center justify-center text-primary/80 hover:text-primary transition-all active:scale-90"
                            title={isAiMode ? "Search again" : "Search"}
                        >
                            <Search size={18} strokeWidth={2.5} />
                        </button>
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
            {!isAiMode && showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-[calc(100%+8px)] z-40 left-0 right-0 rounded-3xl p-2 border border-white/10 bg-background/90 backdrop-blur-3xl shadow-none">
                    <ul className="space-y-1">
                        {suggestions.map((suggestion, index) => (
                            <li
                                key={index}
                                onClick={() => performSearch(suggestion)}
                                onMouseEnter={() => setActiveIndex(index)}
                                className={cn(
                                    "px-4 py-3.5 rounded-2xl cursor-pointer flex items-center gap-3 transition-colors",
                                    index === activeIndex
                                        ? "bg-primary/10 text-primary"
                                        : "text-foreground hover:bg-white/5"
                                )}
                            >
                                <Search size={16} className={cn("shrink-0", index === activeIndex ? "opacity-100" : "opacity-30")} />
                                <span className="text-base font-medium">{suggestion}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

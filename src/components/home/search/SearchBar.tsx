import { useState, useEffect, useRef } from "react";
import { Search, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useSettingsStore } from "@/store/modules/settings";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { SEARCH_ENGINES } from "@/lib/constants";

export function SearchBar() {
    const { t } = useTranslation();
    const [query, setQuery] = useState("");
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
            if (!query.trim()) {
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
    }, [query]);

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
        if (!query.trim()) return;
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
        setOpen(false);
    };

    return (
        <div className="w-full px-4 relative group" ref={containerRef}>
            <form onSubmit={handleSearch} className="relative z-30">
                <div className={cn(
                    "flex gap-2 items-center rounded-2xl p-1.5 transition-all duration-500",
                    "glass-input shadow-2xl shadow-primary/5",
                    "focus-within:ring-4 focus-within:ring-primary/10 group-hover:bg-white/50 dark:group-hover:bg-black/40"
                )}>
                    <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger
                            className="h-11 px-3 glass-button rounded-xl flex items-center justify-center gap-2 cursor-pointer outline-none active:scale-95 transition-all"
                            aria-label={t('select_engine')}
                        >
                            <img
                                src={currentEngine.icon}
                                alt={currentEngine.name}
                                className="w-5 h-5 drop-shadow-sm rounded-sm"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><rect width="20" height="20" fill="%23ddd"/></svg>';
                                }}
                            />
                            <ChevronDown className={cn("size-3.5 opacity-50 transition-transform duration-300", open && "rotate-180")} />
                        </PopoverTrigger>
                        <PopoverContent className="w-56 p-2 rounded-2xl glass-card border-none mt-2 overflow-hidden" align="start">
                            <div className="space-y-1 max-h-[400px] overflow-y-auto overflow-x-hidden custom-scrollbar">
                                {allEngines.map((engine) => (
                                    <button
                                        key={engine.value}
                                        type="button"
                                        onClick={() => handleEngineSelect(engine.value)}
                                        className={cn(
                                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
                                            engine.value === searchEngine
                                                ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                                                : 'hover:bg-primary/10'
                                        )}
                                    >
                                        <img
                                            src={engine.icon}
                                            alt={engine.name}
                                            className="w-4 h-4 rounded-sm"
                                        />
                                        <span className="text-sm font-semibold tracking-tight truncate">{engine.name}</span>
                                    </button>
                                ))}
                            </div>
                        </PopoverContent>
                    </Popover>

                    <div className="flex-1 flex items-center gap-1">
                        <Input
                            type="text"
                            value={query}
                            onChange={(e) => {
                                setQuery(e.target.value);
                                setActiveIndex(-1);
                            }}
                            onKeyDown={handleKeyDown}
                            onFocus={() => query.trim() && setShowSuggestions(true)}
                            placeholder={t('search_placeholder')}
                            className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-lg font-medium tracking-tight placeholder:text-muted-foreground/50 h-11"
                        />
                        <button
                            type="submit"
                            className="p-3 glass-button rounded-xl active:scale-90 transition-all"
                            aria-label={t('search')}
                        >
                            <Search size={18} className="text-primary" />
                        </button>
                    </div>
                </div>
            </form>

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-[calc(100%+8px)] z-20 left-4 right-4 glass-card rounded-3xl p-2 shadow-3xl animate-in fade-in slide-in-from-top-2 duration-300">
                    <ul className="space-y-0.5">
                        {suggestions.map((suggestion, index) => (
                            <li
                                key={index}
                                onClick={() => performSearch(suggestion)}
                                onMouseEnter={() => setActiveIndex(index)}
                                className={cn(
                                    "px-4 py-3 rounded-xl cursor-pointer flex items-center gap-3 transition-all duration-200",
                                    index === activeIndex
                                        ? "bg-primary/10 text-primary translate-x-1"
                                        : "text-muted-foreground hover:bg-muted/30"
                                )}
                            >
                                <Search size={14} className={cn("shrink-0 transition-opacity", index === activeIndex ? "opacity-100" : "opacity-30")} />
                                <span className="text-sm font-medium leading-none">{suggestion}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

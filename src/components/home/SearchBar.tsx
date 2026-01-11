import { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const searchEngines = [
    {
        name: "Google",
        value: "google",
        url: "https://www.google.com/search?q=",
        icon: "https://www.google.com/favicon.ico"
    },
    {
        name: "Bing",
        value: "bing",
        url: "https://www.bing.com/search?q=",
        icon: "https://www.bing.com/favicon.ico"
    },
    {
        name: "DuckDuckGo",
        value: "duckduckgo",
        url: "https://duckduckgo.com/?q=",
        icon: "https://duckduckgo.com/favicon.ico"
    },
    {
        name: "Baidu",
        value: "baidu",
        url: "https://www.baidu.com/s?wd=",
        icon: "https://www.baidu.com/favicon.ico"
    },
];

export function SearchBar() {
    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [open, setOpen] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const searchEngine = useAppStore((state) => state.searchEngine);
    const setSearchEngine = useAppStore((state) => state.setSearchEngine);
    const containerRef = useRef<HTMLDivElement>(null);

    const currentEngine = searchEngines.find(se => se.value === searchEngine) || searchEngines[0];

    // Fetch suggestions from Google
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
                // Google returned format: [query, [suggestions], ...]
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

    // Handle outside click to hide suggestions
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
        const searchUrl = currentEngine.url + encodeURIComponent(searchQuery.trim());
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
        <div className="w-full max-w-2xl mx-auto relative" ref={containerRef}>
            <form onSubmit={handleSearch} className="relative z-20">
                <div className="flex gap-2 items-center bg-background/80 backdrop-blur-sm rounded-2xl shadow-lg border p-2 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                    <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger
                            className="p-2 hover:bg-muted rounded-lg transition-colors flex items-center justify-center cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            aria-label="Select search engine"
                        >
                            <img
                                src={currentEngine.icon}
                                alt={currentEngine.name}
                                className="w-5 h-5"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><rect width="20" height="20" fill="%23ddd"/></svg>';
                                }}
                            />
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-2" align="start">
                            <div className="space-y-1">
                                {searchEngines.map((engine) => (
                                    <button
                                        key={engine.value}
                                        type="button"
                                        onClick={() => handleEngineSelect(engine.value)}
                                        className={cn(
                                            "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                                            engine.value === searchEngine
                                                ? 'bg-primary text-primary-foreground'
                                                : 'hover:bg-muted'
                                        )}
                                    >
                                        <img
                                            src={engine.icon}
                                            alt={engine.name}
                                            className="w-4 h-4"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><rect width="16" height="16" fill="%23ddd"/></svg>';
                                            }}
                                        />
                                        <span className="text-sm font-medium">{engine.name}</span>
                                    </button>
                                ))}
                            </div>
                        </PopoverContent>
                    </Popover>

                    <div className="flex-1 flex items-center gap-2">
                        <Input
                            type="text"
                            value={query}
                            onChange={(e) => {
                                setQuery(e.target.value);
                                setActiveIndex(-1);
                            }}
                            onKeyDown={handleKeyDown}
                            onFocus={() => query.trim() && setShowSuggestions(true)}
                            placeholder="Search the web..."
                            className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
                        />
                        <button
                            type="submit"
                            className="p-2 hover:bg-muted rounded-lg transition-colors"
                            aria-label="Search"
                        >
                            <Search size={20} className="text-muted-foreground" />
                        </button>
                    </div>
                </div>
            </form>

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-[calc(100%+4px)] left-0 right-0 bg-background/95 backdrop-blur-md rounded-2xl shadow-xl border overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-100">
                    <ul className="py-2">
                        {suggestions.map((suggestion, index) => (
                            <li
                                key={index}
                                onClick={() => performSearch(suggestion)}
                                onMouseEnter={() => setActiveIndex(index)}
                                className={cn(
                                    "px-4 py-2 cursor-pointer flex items-center gap-3 transition-colors",
                                    index === activeIndex ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50"
                                )}
                            >
                                <Search size={14} className="flex-shrink-0 opacity-50" />
                                <span className="text-sm truncate">{suggestion}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

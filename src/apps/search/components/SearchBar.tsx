import { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useSearchPreferenceStore } from "@/config";
import { cn } from "@/shared/utils";
import AppSurface from "@/platform/ui/surface/AppSurface";

interface SearchBarProps {
    initialQuery?: string;
}

export function SearchBar({ initialQuery = "" }: SearchBarProps) {
    const [query, setQuery] = useState(initialQuery);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [engineMenuOpen, setEngineMenuOpen] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const searchEngine = useSearchPreferenceStore((state) => state.searchEngine);
    const setSearchEngine = useSearchPreferenceStore((state) => state.setSearchEngine);
    const searchEngines = useSearchPreferenceStore((state) => state.searchEngines);

    const containerRef = useRef<HTMLDivElement>(null);

    const currentEngine = searchEngines.find((entry) => entry.value === searchEngine) || searchEngines[0];

    useEffect(() => {
        const fetchSuggestions = async () => {
            if (!query.trim() || engineMenuOpen) {
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
                console.error("Failed to fetch suggestions:", error);
            }
        };

        const timer = setTimeout(fetchSuggestions, 200);
        return () => clearTimeout(timer);
    }, [engineMenuOpen, query]);

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

        let searchUrl = currentEngine.url;
        if (searchUrl.includes("%s")) {
            searchUrl = searchUrl.replace("%s", encodeURIComponent(trimmedQuery));
        } else {
            searchUrl = searchUrl + encodeURIComponent(trimmedQuery);
        }

        window.open(searchUrl, "_blank", "noopener,noreferrer");
        setQuery("");
        setShowSuggestions(false);
        setActiveIndex(-1);
    };

    const handleSearch = (event: React.FormEvent) => {
        event.preventDefault();
        performSearch(query);
    };

    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (!showSuggestions || suggestions.length === 0) return;

        if (event.key === "ArrowDown") {
            event.preventDefault();
            setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
        } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setActiveIndex((prev) => (prev > -1 ? prev - 1 : prev));
        } else if (event.key === "Enter" && activeIndex > -1) {
            event.preventDefault();
            performSearch(suggestions[activeIndex]);
        } else if (event.key === "Escape") {
            setShowSuggestions(false);
        }
    };

    return (
        <div className="modal-minimal-scope relative w-full group" ref={containerRef}>
            <form onSubmit={handleSearch} className="relative z-30">
                <div className="relative h-12 md:h-14">
                    <div className="absolute inset-0 pointer-events-none">
                        <AppSurface
                            variant="search-bar"
                            hideSurfaceBorder={false}
                            className="h-full w-full"
                        />
                    </div>

                    <div className="relative z-10 flex h-full items-center gap-2 rounded-full px-3 transition-all duration-300">
                        <div className="relative shrink-0">
                            <button
                                type="button"
                                onClick={() =>
                                    setEngineMenuOpen((prev) => {
                                        const next = !prev;
                                        if (next) {
                                            setShowSuggestions(false);
                                        }
                                        return next;
                                    })
                                }
                                className="btn-no-style flex h-8 w-8 items-center justify-center cursor-pointer outline-none active:scale-90 transition-transform"
                            >
                                <img
                                    src={currentEngine.icon}
                                    alt=""
                                    className="h-full w-full rounded-full object-contain"
                                />
                            </button>
                            {engineMenuOpen ? (
                                <div className="absolute left-[-6px] top-[calc(100%+16px)] z-50 w-60 overflow-hidden rounded-2xl shadow-[0_18px_45px_rgba(0,0,0,0.35)]">
                                    <div className="absolute inset-0 pointer-events-none">
                                        <AppSurface
                                            variant="widget"
                                            hideSurfaceBorder={false}
                                            style={{ outline: "none", boxShadow: "none" }}
                                            className="h-full w-full"
                                        />
                                    </div>
                                    <div className="relative z-10 p-2">
                                        <div className="max-h-[400px] space-y-1 overflow-y-auto custom-scrollbar">
                                            {searchEngines.map((engine) => (
                                                <button
                                                    key={engine.value}
                                                    type="button"
                                                    onClick={() => {
                                                        setSearchEngine(engine.value);
                                                        setEngineMenuOpen(false);
                                                    }}
                                                    className={cn(
                                                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 border-0 shadow-none outline-none",
                                                        engine.value === searchEngine
                                                            ? "bg-foreground/16 text-foreground font-semibold"
                                                            : "text-foreground hover:bg-foreground/12"
                                                    )}
                                                >
                                                    <div className="flex h-5 w-5 items-center justify-center shrink-0">
                                                        <img src={engine.icon} alt="" className="h-4.5 w-4.5 rounded-sm object-contain" />
                                                    </div>
                                                    <span className="text-sm font-medium">{engine.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : null}
                        </div>

                        <div className="flex h-full flex-1 items-center">
                            <Input
                                type="text"
                                autoFocus
                                value={query}
                                onChange={(event) => {
                                    setQuery(event.target.value);
                                    setActiveIndex(-1);
                                }}
                                onKeyDown={handleKeyDown}
                                onFocus={() => {
                                    setEngineMenuOpen(false);
                                    if (query.trim()) {
                                        setShowSuggestions(true);
                                    }
                                }}
                                placeholder="Search"
                                className="text-surface-input h-full w-full rounded-none border-0 px-0 py-0 text-base font-medium shadow-none ring-0 focus-visible:ring-0 md:text-lg"
                            />
                        </div>

                        <div className="flex items-center gap-1">
                            <button
                                type="submit"
                                className="flex h-8 w-8 items-center justify-center text-[var(--text-surface-foreground)] transition-all hover:opacity-80 active:scale-90"
                                title="Search"
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

            {!engineMenuOpen && showSuggestions && suggestions.length > 0 ? (
                <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-40 overflow-hidden rounded-3xl shadow-[0_18px_45px_rgba(0,0,0,0.35)]">
                    <div className="absolute inset-0 pointer-events-none">
                        <AppSurface
                            variant="widget"
                            hideSurfaceBorder={false}
                            width="100%"
                            height="100%"
                            borderRadius={24}
                            style={{ outline: "none", boxShadow: "none" }}
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
                                        "flex cursor-pointer items-center gap-3 rounded-2xl px-4 py-3.5 transition-colors",
                                        index === activeIndex
                                            ? "bg-foreground/16 text-foreground"
                                            : "text-foreground hover:bg-foreground/12"
                                    )}
                                >
                                    <Search
                                        size={16}
                                        className={cn("shrink-0", index === activeIndex ? "opacity-100" : "opacity-30")}
                                    />
                                    <span className="text-base font-medium">{suggestion}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            ) : null}
        </div>
    );
}

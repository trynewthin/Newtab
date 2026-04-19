import type { SearchEnginePreferenceItem } from "@/config";

const MAX_SUGGESTIONS = 8;

type SuggestionFetcher = (query: string, signal: AbortSignal) => Promise<string[]>;

const suggestionFetchers: Record<string, SuggestionFetcher> = {
    google: (query, signal) =>
        fetchJsonSuggestions(
            `https://suggestqueries.google.com/complete/search?client=chrome&q=${encodeURIComponent(query)}`,
            signal
        ),
    bing: async (query, signal) => {
        const content = await fetchText(
            `https://www.bing.com/AS/Suggestions?pt=page.home&mkt=en-us&qry=${encodeURIComponent(query)}&cp=${query.length}&cvid=1234567890abcdef1234567890abcdef`,
            signal
        );
        const document = new DOMParser().parseFromString(content, "text/html");

        return Array.from(document.querySelectorAll<HTMLElement>("li.sa_sg[query]"))
            .map((element) => element.getAttribute("query")?.trim() ?? "")
            .filter(Boolean)
            .slice(0, MAX_SUGGESTIONS);
    },
    duckduckgo: (query, signal) =>
        fetchJsonSuggestions(
            `https://duckduckgo.com/ac/?q=${encodeURIComponent(query)}&type=list`,
            signal
        ),
    baidu: async (query, signal) => {
        const content = await fetchText(
            `https://suggestion.baidu.com/su?wd=${encodeURIComponent(query)}&json=1&p=3`,
            signal
        );
        const matched = content.match(/window\.baidu\.sug\((.*)\);?$/s);
        if (!matched) {
            return [];
        }

        try {
            const parsed = JSON.parse(matched[1]) as { s?: unknown };
            return normalizeSuggestionList(parsed.s);
        } catch {
            return [];
        }
    },
    yandex: async (query, signal) => {
        const response = await fetch(
            `https://yandex.com/suggest/suggest-ya.cgi?part=${encodeURIComponent(query)}&uil=en&v=4`,
            { signal }
        );
        const data = await response.json();
        return normalizeSuggestionList(Array.isArray(data) ? data[1] : undefined);
    },
    youtube: (query, signal) =>
        fetchJsonSuggestions(
            `https://suggestqueries.google.com/complete/search?client=chrome&ds=yt&q=${encodeURIComponent(query)}`,
            signal
        ),
    wikipedia: async (query, signal) => {
        const response = await fetch(
            `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=${MAX_SUGGESTIONS}&namespace=0&format=json`,
            { signal }
        );
        const data = await response.json();
        return normalizeSuggestionList(Array.isArray(data) ? data[1] : undefined);
    },
    bilibili: async (query, signal) => {
        const response = await fetch(
            `https://s.search.bilibili.com/main/suggest?term=${encodeURIComponent(query)}`,
            { signal }
        );
        const data = await response.json() as {
            result?: {
                tag?: Array<{
                    value?: string;
                }>;
            };
        };

        return (data.result?.tag ?? [])
            .map((item) => item.value?.trim() ?? "")
            .filter(Boolean)
            .slice(0, MAX_SUGGESTIONS);
    },
};

async function fetchText(url: string, signal: AbortSignal) {
    const response = await fetch(url, { signal });
    return response.text();
}

async function fetchJsonSuggestions(url: string, signal: AbortSignal) {
    const response = await fetch(url, { signal });
    const data = await response.json();
    return normalizeSuggestionList(Array.isArray(data) ? data[1] : undefined);
}

function normalizeSuggestionList(value: unknown) {
    if (!Array.isArray(value)) {
        return [];
    }

    return value
        .map((entry) => typeof entry === "string" ? entry.trim() : "")
        .filter(Boolean)
        .slice(0, MAX_SUGGESTIONS);
}

export async function fetchSearchSuggestions(
    engine: SearchEnginePreferenceItem | undefined,
    query: string,
    signal: AbortSignal
) {
    const trimmedQuery = query.trim();
    if (!trimmedQuery || !engine) {
        return [];
    }

    const fetcher = suggestionFetchers[engine.value];
    if (!fetcher) {
        return [];
    }

    try {
        return await fetcher(trimmedQuery, signal);
    } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
            return [];
        }

        console.error(`Failed to fetch suggestions for ${engine.value}:`, error);
        return [];
    }
}

import { SEARCH_ENGINES } from "@/shared/constants";

export interface SearchEnginePreferenceItem {
    name: string;
    value: string;
    url: string;
    icon?: string;
}

export interface SearchPreferenceData {
    searchEngine: string;
    searchEngines: SearchEnginePreferenceItem[];
}

export const SEARCH_PREFERENCE_STORAGE_KEY = "app-preferences-search";
export const LEGACY_SETTINGS_STORAGE_KEY = "app-settings";

function getDefaultSearchEngines(): SearchEnginePreferenceItem[] {
    return SEARCH_ENGINES.map((engine) => ({ ...engine }));
}

function normalizeSearchEngine(value: unknown): SearchEnginePreferenceItem | null {
    if (!value || typeof value !== "object") {
        return null;
    }

    const record = value as Record<string, unknown>;
    if (
        typeof record.name !== "string" ||
        typeof record.value !== "string" ||
        typeof record.url !== "string"
    ) {
        return null;
    }

    return {
        name: record.name,
        value: record.value,
        url: record.url,
        icon: typeof record.icon === "string" ? record.icon : undefined,
    };
}

export function normalizeSearchPreferenceState(
    value: unknown,
    fallback?: SearchPreferenceData
): SearchPreferenceData {
    const fallbackState = fallback ?? {
        searchEngine: "google",
        searchEngines: getDefaultSearchEngines(),
    };

    if (!value || typeof value !== "object") {
        return fallbackState;
    }

    const record = value as {
        searchEngine?: unknown;
        searchEngines?: unknown;
        customSearchEngines?: unknown;
    };

    const searchEngines = Array.isArray(record.searchEngines)
        ? record.searchEngines
            .map(normalizeSearchEngine)
            .filter((engine): engine is SearchEnginePreferenceItem => engine !== null)
        : Array.isArray(record.customSearchEngines)
            ? [
                ...getDefaultSearchEngines(),
                ...record.customSearchEngines
                    .map(normalizeSearchEngine)
                    .filter((engine): engine is SearchEnginePreferenceItem => engine !== null),
            ]
            : fallbackState.searchEngines;

    const resolvedSearchEngines = searchEngines.length > 0 ? searchEngines : fallbackState.searchEngines;

    const searchEngine = typeof record.searchEngine === "string" &&
        resolvedSearchEngines.some((engine) => engine.value === record.searchEngine)
        ? record.searchEngine
        : (resolvedSearchEngines[0]?.value ?? fallbackState.searchEngine);

    return {
        searchEngine,
        searchEngines: resolvedSearchEngines,
    };
}

function parseSearchPreferenceFromPersistedRaw(raw: string | null): SearchPreferenceData | undefined {
    if (!raw) return undefined;

    try {
        const parsed = JSON.parse(raw) as {
            state?: {
                searchEngine?: unknown;
                searchEngines?: unknown;
                customSearchEngines?: unknown;
            };
            searchEngine?: unknown;
            searchEngines?: unknown;
            customSearchEngines?: unknown;
        };

        return normalizeSearchPreferenceState(parsed.state ?? parsed);
    } catch {
        return undefined;
    }
}

export function readLegacySearchPreference(): SearchPreferenceData | undefined {
    if (typeof window === "undefined") return undefined;
    return parseSearchPreferenceFromPersistedRaw(
        window.localStorage.getItem(LEGACY_SETTINGS_STORAGE_KEY)
    );
}

export function readStoredSearchPreference(): SearchPreferenceData {
    if (typeof window === "undefined") {
        return {
            searchEngine: "google",
            searchEngines: getDefaultSearchEngines(),
        };
    }

    return (
        parseSearchPreferenceFromPersistedRaw(
            window.localStorage.getItem(SEARCH_PREFERENCE_STORAGE_KEY)
        )
        ?? readLegacySearchPreference()
        ?? {
            searchEngine: "google",
            searchEngines: getDefaultSearchEngines(),
        }
    );
}

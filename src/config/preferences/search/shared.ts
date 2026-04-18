import { SEARCH_ENGINES } from "@/shared/constants";

export interface CustomSearchEngine {
    name: string;
    value: string;
    url: string;
    icon?: string;
}

export interface SearchPreferenceData {
    searchEngine: string;
    customSearchEngines: CustomSearchEngine[];
}

export const SEARCH_PREFERENCE_STORAGE_KEY = "app-preferences-search";
export const LEGACY_SETTINGS_STORAGE_KEY = "app-settings";

const VALID_BUILTIN_SEARCH_ENGINES = new Set(
    SEARCH_ENGINES.map((engine) => engine.value)
);

function normalizeCustomSearchEngine(value: unknown): CustomSearchEngine | null {
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
        customSearchEngines: [],
    };

    if (!value || typeof value !== "object") {
        return fallbackState;
    }

    const record = value as {
        searchEngine?: unknown;
        customSearchEngines?: unknown;
    };

    const customSearchEngines = Array.isArray(record.customSearchEngines)
        ? record.customSearchEngines
            .map(normalizeCustomSearchEngine)
            .filter((engine): engine is CustomSearchEngine => engine !== null)
        : fallbackState.customSearchEngines;

    const searchEngine = typeof record.searchEngine === "string" &&
        (
            VALID_BUILTIN_SEARCH_ENGINES.has(record.searchEngine) ||
            customSearchEngines.some((engine) => engine.value === record.searchEngine)
        )
        ? record.searchEngine
        : fallbackState.searchEngine;

    return {
        searchEngine,
        customSearchEngines,
    };
}

function parseSearchPreferenceFromPersistedRaw(raw: string | null): SearchPreferenceData | undefined {
    if (!raw) return undefined;

    try {
        const parsed = JSON.parse(raw) as {
            state?: {
                searchEngine?: unknown;
                customSearchEngines?: unknown;
            };
            searchEngine?: unknown;
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
            customSearchEngines: [],
        };
    }

    return (
        parseSearchPreferenceFromPersistedRaw(
            window.localStorage.getItem(SEARCH_PREFERENCE_STORAGE_KEY)
        )
        ?? readLegacySearchPreference()
        ?? {
            searchEngine: "google",
            customSearchEngines: [],
        }
    );
}

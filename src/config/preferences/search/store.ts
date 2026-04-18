import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createPersistConfig } from "@/platform/persistence/zustandStorage";
import {
    normalizeSearchPreferenceState,
    readLegacySearchPreference,
    SEARCH_PREFERENCE_STORAGE_KEY,
    type CustomSearchEngine,
    type SearchPreferenceData,
} from "./shared";

interface SearchPreferenceState extends SearchPreferenceData {
    setSearchEngine: (engine: string) => void;
    addCustomSearchEngine: (engine: CustomSearchEngine) => void;
    removeCustomSearchEngine: (value: string) => void;
    updateCustomSearchEngine: (
        value: string,
        engine: Partial<Pick<CustomSearchEngine, "name" | "url" | "icon">>
    ) => void;
}

function readPersistedSearchPreference(persistedState: unknown): SearchPreferenceData | undefined {
    if (!persistedState || typeof persistedState !== "object") {
        return undefined;
    }

    const persistedRecord = persistedState as {
        searchEngine?: unknown;
        customSearchEngines?: unknown;
        state?: {
            searchEngine?: unknown;
            customSearchEngines?: unknown;
        };
    };

    return normalizeSearchPreferenceState(persistedRecord.state ?? persistedRecord);
}

function mergePersistedSearchPreference(
    persistedState: unknown,
    currentState: SearchPreferenceState
): SearchPreferenceState {
    const fallbackState = readLegacySearchPreference() ?? {
        searchEngine: currentState.searchEngine,
        customSearchEngines: currentState.customSearchEngines,
    };
    const persistedPreference = readPersistedSearchPreference(persistedState);

    return {
        ...currentState,
        ...normalizeSearchPreferenceState(persistedPreference, fallbackState),
    };
}

export const useSearchPreferenceStore = create<SearchPreferenceState>()(
    persist(
        (set) => ({
            searchEngine: "google",
            customSearchEngines: [],
            setSearchEngine: (searchEngine: string) => set({ searchEngine }),
            addCustomSearchEngine: (engine: CustomSearchEngine) =>
                set((state: SearchPreferenceState) => ({
                    customSearchEngines: [...state.customSearchEngines, engine],
                })),
            removeCustomSearchEngine: (value: string) =>
                set((state: SearchPreferenceState) => ({
                    customSearchEngines: state.customSearchEngines.filter(
                        (engine: CustomSearchEngine) => engine.value !== value
                    ),
                    searchEngine: state.searchEngine === value ? "google" : state.searchEngine,
                })),
            updateCustomSearchEngine: (
                value: string,
                engine: Partial<Pick<CustomSearchEngine, "name" | "url" | "icon">>
            ) =>
                set((state: SearchPreferenceState) => ({
                    customSearchEngines: state.customSearchEngines.map((entry: CustomSearchEngine) =>
                        entry.value === value ? { ...entry, ...engine } : entry
                    ),
                })),
        }),
        createPersistConfig(SEARCH_PREFERENCE_STORAGE_KEY, {
            merge: mergePersistedSearchPreference,
        })
    )
);

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { storageRegistry } from "@/platform/persistence/registry";
import { createPersistConfig } from "@/platform/persistence/zustandStorage";
import {
    normalizeSearchPreferenceState,
    readLegacySearchPreference,
    SEARCH_PREFERENCE_STORAGE_KEY,
    type SearchEnginePreferenceItem,
    type SearchPreferenceData,
} from "./shared";

interface SearchPreferenceState extends SearchPreferenceData {
    setSearchEngine: (engine: string) => void;
    addSearchEngine: (engine: SearchEnginePreferenceItem) => void;
    removeSearchEngine: (value: string) => void;
    moveSearchEngine: (value: string, direction: "up" | "down") => void;
    updateSearchEngine: (
        value: string,
        engine: Partial<Pick<SearchEnginePreferenceItem, "name" | "url" | "icon">>
    ) => void;
}

function readPersistedSearchPreference(persistedState: unknown): SearchPreferenceData | undefined {
    if (!persistedState || typeof persistedState !== "object") {
        return undefined;
    }

    const persistedRecord = persistedState as {
        searchEngine?: unknown;
        searchEngines?: unknown;
        customSearchEngines?: unknown;
        state?: {
            searchEngine?: unknown;
            searchEngines?: unknown;
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
        searchEngines: currentState.searchEngines,
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
            searchEngines: normalizeSearchPreferenceState(undefined).searchEngines,
            setSearchEngine: (searchEngine: string) => set({ searchEngine }),
            addSearchEngine: (engine: SearchEnginePreferenceItem) =>
                set((state: SearchPreferenceState) => ({
                    searchEngines: [...state.searchEngines, engine],
                })),
            removeSearchEngine: (value: string) =>
                set((state: SearchPreferenceState) => {
                    const nextSearchEngines = state.searchEngines.filter(
                        (engine: SearchEnginePreferenceItem) => engine.value !== value
                    );

                    if (nextSearchEngines.length === 0) {
                        return state;
                    }

                    return {
                        searchEngines: nextSearchEngines,
                        searchEngine: state.searchEngine === value
                            ? nextSearchEngines[0].value
                            : state.searchEngine,
                    };
                }),
            moveSearchEngine: (value: string, direction: "up" | "down") =>
                set((state: SearchPreferenceState) => {
                    const currentIndex = state.searchEngines.findIndex(
                        (engine: SearchEnginePreferenceItem) => engine.value === value
                    );

                    if (currentIndex < 0) {
                        return state;
                    }

                    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
                    if (targetIndex < 0 || targetIndex >= state.searchEngines.length) {
                        return state;
                    }

                    const nextSearchEngines = [...state.searchEngines];
                    [nextSearchEngines[currentIndex], nextSearchEngines[targetIndex]] = [
                        nextSearchEngines[targetIndex],
                        nextSearchEngines[currentIndex],
                    ];

                    return {
                        searchEngines: nextSearchEngines,
                    };
                }),
            updateSearchEngine: (
                value: string,
                engine: Partial<Pick<SearchEnginePreferenceItem, "name" | "url" | "icon">>
            ) =>
                set((state: SearchPreferenceState) => ({
                    searchEngines: state.searchEngines.map((entry: SearchEnginePreferenceItem) =>
                        entry.value === value ? { ...entry, ...engine } : entry
                    ),
                })),
        }),
        createPersistConfig<SearchPreferenceState>(SEARCH_PREFERENCE_STORAGE_KEY, {
            merge: mergePersistedSearchPreference,
        })
    )
);

storageRegistry.registerRehydrator(
    SEARCH_PREFERENCE_STORAGE_KEY,
    () => useSearchPreferenceStore.persist.rehydrate()
);

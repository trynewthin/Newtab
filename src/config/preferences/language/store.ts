import { create } from "zustand";
import { persist } from "zustand/middleware";
import { storageRegistry } from "@/platform/persistence/registry";
import { createPersistConfig } from "@/platform/persistence/zustandStorage";
import {
    LANGUAGE_PREFERENCE_STORAGE_KEY,
    normalizeLanguagePreference,
    readLegacyLanguagePreference,
    type SupportedLanguage,
} from "./shared";

interface LanguagePreferenceState {
    language: SupportedLanguage;
    setLanguage: (language: SupportedLanguage) => void;
}

function readPersistedLanguage(persistedState: unknown): SupportedLanguage | undefined {
    if (!persistedState || typeof persistedState !== "object") {
        return undefined;
    }

    const persistedRecord = persistedState as {
        language?: unknown;
        state?: {
            language?: unknown;
        };
    };

    const value = persistedRecord.language ?? persistedRecord.state?.language;
    if (value === "zh" || value === "en") {
        return value;
    }

    return undefined;
}

function mergePersistedLanguagePreference(
    persistedState: unknown,
    currentState: LanguagePreferenceState
): LanguagePreferenceState {
    const fallbackLanguage = readLegacyLanguagePreference() ?? currentState.language;
    const persistedLanguage = readPersistedLanguage(persistedState);

    return {
        ...currentState,
        language: normalizeLanguagePreference(persistedLanguage, fallbackLanguage),
    };
}

export const useLanguagePreferenceStore = create<LanguagePreferenceState>()(
    persist(
        (set) => ({
            language: "zh",
            setLanguage: (language: SupportedLanguage) => set({ language }),
        }),
        createPersistConfig<LanguagePreferenceState>(LANGUAGE_PREFERENCE_STORAGE_KEY, {
            merge: mergePersistedLanguagePreference,
        })
    )
);

storageRegistry.registerRehydrator(
    LANGUAGE_PREFERENCE_STORAGE_KEY,
    () => useLanguagePreferenceStore.persist.rehydrate()
);

export function getLanguagePreference(): SupportedLanguage {
    return useLanguagePreferenceStore.getState().language;
}

export function setLanguagePreference(language: SupportedLanguage) {
    useLanguagePreferenceStore.getState().setLanguage(language);
}

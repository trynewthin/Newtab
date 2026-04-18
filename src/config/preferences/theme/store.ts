import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createPersistConfig } from "@/platform/persistence/zustandStorage";
import {
    readLegacyThemePreference,
    resolveThemeMode,
    THEME_PREFERENCE_STORAGE_KEY,
    type ResolvedThemeMode,
    type ThemeMode,
} from "./shared";

interface ThemePreferenceState {
    theme: ThemeMode;
    setTheme: (theme: ThemeMode) => void;
    toggleTheme: () => void;
}

function readPersistedTheme(persistedState: unknown): ThemeMode | undefined {
    if (!persistedState || typeof persistedState !== "object") {
        return undefined;
    }

    const persistedRecord = persistedState as {
        theme?: unknown;
        state?: {
            theme?: unknown;
        };
    };

    const value = persistedRecord.theme ?? persistedRecord.state?.theme;
    if (value === "light" || value === "dark" || value === "system") {
        return value;
    }

    return undefined;
}

function mergePersistedThemePreference(
    persistedState: unknown,
    currentState: ThemePreferenceState
): ThemePreferenceState {
    const fallbackTheme = readLegacyThemePreference() ?? currentState.theme;
    const persistedTheme = readPersistedTheme(persistedState);

    return {
        ...currentState,
        theme: persistedTheme ?? fallbackTheme,
    };
}

export const useThemePreferenceStore = create<ThemePreferenceState>()(
    persist(
        (set, get) => ({
            theme: "light",
            setTheme: (theme: ThemeMode) => set({ theme }),
            toggleTheme: () => {
                const resolvedTheme = resolveThemeMode(get().theme);
                set({ theme: resolvedTheme === "dark" ? "light" : "dark" });
            },
        }),
        createPersistConfig(THEME_PREFERENCE_STORAGE_KEY, {
            merge: mergePersistedThemePreference,
        })
    )
);

export function getThemePreference(): ThemeMode {
    return useThemePreferenceStore.getState().theme;
}

export function setThemePreference(theme: ThemeMode) {
    useThemePreferenceStore.getState().setTheme(theme);
}

export function toggleThemePreference() {
    useThemePreferenceStore.getState().toggleTheme();
}

export function getResolvedThemePreference(): ResolvedThemeMode {
    return resolveThemeMode(getThemePreference());
}

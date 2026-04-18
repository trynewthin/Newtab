export type ThemeMode = "light" | "dark" | "system";
export type ResolvedThemeMode = "light" | "dark";

export const THEME_PREFERENCE_STORAGE_KEY = "app-preferences-theme";
export const LEGACY_SETTINGS_STORAGE_KEY = "app-settings";

function parseThemeMode(value: unknown): ThemeMode | undefined {
    if (value === "light" || value === "dark" || value === "system") {
        return value;
    }
    return undefined;
}

function parseThemeModeFromPersistedRaw(raw: string | null): ThemeMode | undefined {
    if (!raw) return undefined;

    try {
        const parsed = JSON.parse(raw) as { state?: { theme?: unknown }; theme?: unknown };
        return parseThemeMode(parsed?.state?.theme ?? parsed?.theme);
    } catch {
        return undefined;
    }
}

export function readLegacyThemePreference(): ThemeMode | undefined {
    if (typeof window === "undefined") return undefined;
    return parseThemeModeFromPersistedRaw(window.localStorage.getItem(LEGACY_SETTINGS_STORAGE_KEY));
}

export function readStoredThemePreference(): ThemeMode {
    if (typeof window === "undefined") return "light";

    return (
        parseThemeModeFromPersistedRaw(window.localStorage.getItem(THEME_PREFERENCE_STORAGE_KEY))
        ?? readLegacyThemePreference()
        ?? "light"
    );
}

export function normalizeThemeMode(value: unknown, fallback: ThemeMode = "light"): ThemeMode {
    return parseThemeMode(value) ?? fallback;
}

export function resolveThemeMode(theme: ThemeMode): ResolvedThemeMode {
    if (theme === "light" || theme === "dark") {
        return theme;
    }

    if (typeof window === "undefined") {
        return "light";
    }

    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyThemePreferenceToDOM(theme: ThemeMode): ResolvedThemeMode {
    const resolvedTheme = resolveThemeMode(theme);

    if (typeof document === "undefined") {
        return resolvedTheme;
    }

    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(resolvedTheme);
    document.body.style.backgroundColor = resolvedTheme === "dark" ? "#0d0d14" : "#f5f5f7";
    return resolvedTheme;
}

export type SupportedLanguage = "en" | "zh";

export const LANGUAGE_PREFERENCE_STORAGE_KEY = "app-preferences-language";
export const LEGACY_I18N_LANGUAGE_STORAGE_KEY = "i18nextLng";

function parseSupportedLanguage(value: unknown): SupportedLanguage | undefined {
    if (typeof value !== "string") {
        return undefined;
    }

    const normalized = value.toLowerCase();
    if (normalized.startsWith("zh")) {
        return "zh";
    }
    if (normalized.startsWith("en")) {
        return "en";
    }

    return undefined;
}

function parseSupportedLanguageFromPersistedRaw(raw: string | null): SupportedLanguage | undefined {
    if (!raw) return undefined;

    try {
        const parsed = JSON.parse(raw) as { state?: { language?: unknown }; language?: unknown };
        return parseSupportedLanguage(parsed?.state?.language ?? parsed?.language);
    } catch {
        return parseSupportedLanguage(raw);
    }
}

export function normalizeLanguagePreference(
    value: unknown,
    fallback: SupportedLanguage = "zh"
): SupportedLanguage {
    return parseSupportedLanguage(value) ?? fallback;
}

export function readLegacyLanguagePreference(): SupportedLanguage | undefined {
    if (typeof window === "undefined") return undefined;
    return parseSupportedLanguage(window.localStorage.getItem(LEGACY_I18N_LANGUAGE_STORAGE_KEY));
}

export function readStoredLanguagePreference(): SupportedLanguage {
    if (typeof window === "undefined") return "zh";

    return (
        parseSupportedLanguageFromPersistedRaw(
            window.localStorage.getItem(LANGUAGE_PREFERENCE_STORAGE_KEY)
        )
        ?? readLegacyLanguagePreference()
        ?? parseSupportedLanguage(window.navigator.language)
        ?? "zh"
    );
}

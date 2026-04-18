import i18n from "./i18n";
import {
    LEGACY_I18N_LANGUAGE_STORAGE_KEY,
    normalizeLanguagePreference,
    type SupportedLanguage,
} from "@/config";

export async function applyLanguagePreferenceToI18n(
    language: SupportedLanguage
): Promise<SupportedLanguage> {
    const normalized = normalizeLanguagePreference(language);

    if (typeof window !== "undefined") {
        window.localStorage.setItem(LEGACY_I18N_LANGUAGE_STORAGE_KEY, normalized);
    }

    await i18n.changeLanguage(normalized);
    return normalized;
}

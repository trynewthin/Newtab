import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import {
    normalizeLanguagePreference,
    readStoredLanguagePreference,
    type SupportedLanguage,
} from "@/config";

const loadedLanguages = new Set<SupportedLanguage>();

const languageLoaders = {
    en: () => Promise.all([
        import("./locales/en/common"),
        import("./locales/en/settings"),
        import("./locales/en/appearance"),
        import("./locales/en/tools"),
    ]),
    zh: () => Promise.all([
        import("./locales/zh/common"),
        import("./locales/zh/settings"),
        import("./locales/zh/appearance"),
        import("./locales/zh/tools"),
    ]),
} as const;

async function loadLanguageResources(lang: SupportedLanguage) {
    if (loadedLanguages.has(lang)) return;

    const [common, settings, appearance, tools] = await languageLoaders[lang]();

    const messages = {
        ...common.common,
        ...settings.settings,
        ...appearance.appearance,
        ...tools.tools,
    };

    i18n.addResourceBundle(lang, "translation", messages, true, true);
    loadedLanguages.add(lang);
}

const initialLanguage = readStoredLanguagePreference();

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {},
        lng: initialLanguage,
        fallbackLng: "zh",
        debug: false,
        interpolation: {
            escapeValue: false,
        },
        react: {
            useSuspense: false,
        },
    });

const rawChangeLanguage = i18n.changeLanguage.bind(i18n);

i18n.changeLanguage = async (lng, callback) => {
    const normalized = normalizeLanguagePreference(lng ?? i18n.language);
    await loadLanguageResources(normalized);
    return rawChangeLanguage(normalized, callback);
};

void (async () => {
    await loadLanguageResources(initialLanguage);
    await rawChangeLanguage(initialLanguage);
})();

export default i18n;

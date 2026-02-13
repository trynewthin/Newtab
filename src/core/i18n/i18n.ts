import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

type SupportedLang = "en" | "zh";

const loadedLanguages = new Set<SupportedLang>();

const languageLoaders = {
    en: () => Promise.all([
        import("./locales/en/common"),
        import("./locales/en/settings"),
        import("./locales/en/appearance"),
        import("./locales/en/ai"),
        import("./locales/en/tools"),
    ]),
    zh: () => Promise.all([
        import("./locales/zh/common"),
        import("./locales/zh/settings"),
        import("./locales/zh/appearance"),
        import("./locales/zh/ai"),
        import("./locales/zh/tools"),
    ]),
} as const;

const normalizeLanguage = (lang?: string | null): SupportedLang => {
    if (!lang) return "zh";
    return lang.toLowerCase().startsWith("zh") ? "zh" : "en";
};

async function loadLanguageResources(lang: SupportedLang) {
    if (loadedLanguages.has(lang)) return;

    const [common, settings, appearance, ai, tools] = await languageLoaders[lang]();

    const messages = {
        ...common.common,
        ...settings.settings,
        ...appearance.appearance,
        ...ai.ai,
        ...tools.tools,
    };

    i18n.addResourceBundle(lang, "translation", messages, true, true);
    loadedLanguages.add(lang);
}

const initialLanguage = normalizeLanguage(
    (typeof localStorage !== "undefined" ? localStorage.getItem("i18nextLng") : null) ||
    (typeof navigator !== "undefined" ? navigator.language : "zh")
);

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {},
        lng: initialLanguage,
        fallbackLng: 'zh',
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
    const normalized = normalizeLanguage(lng ?? i18n.language);
    await loadLanguageResources(normalized);
    return rawChangeLanguage(normalized, callback);
};

void (async () => {
    await loadLanguageResources(initialLanguage);
    await rawChangeLanguage(initialLanguage);
})();

export default i18n;

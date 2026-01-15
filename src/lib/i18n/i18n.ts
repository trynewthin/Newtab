import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import modules
import { common as commonEn } from './locales/en/common';
import { settings as settingsEn } from './locales/en/settings';
import { appearance as appearanceEn } from './locales/en/appearance';
import { ai as aiEn } from './locales/en/ai';
import { tools as toolsEn } from './locales/en/tools';

import { common as commonZh } from './locales/zh/common';
import { settings as settingsZh } from './locales/zh/settings';
import { appearance as appearanceZh } from './locales/zh/appearance';
import { ai as aiZh } from './locales/zh/ai';
import { tools as toolsZh } from './locales/zh/tools';

// Translation resources
const resources = {
    en: {
        translation: {
            ...commonEn,
            ...settingsEn,
            ...appearanceEn,
            ...aiEn,
            ...toolsEn,
        }
    },
    zh: {
        translation: {
            ...commonZh,
            ...settingsZh,
            ...appearanceZh,
            ...aiZh,
            ...toolsZh,
        }
    }
};

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'zh',
        debug: false,
        interpolation: {
            escapeValue: false,
        }
    });

export default i18n;

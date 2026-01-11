import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// 翻译资源
// 实际开发中，建议将翻译文件拆分为独立的 JSON 文件
const resources = {
    en: {
        translation: {
            "welcome": "Welcome to React",
            "subtitle": "Edit src/App.tsx and save to see HMR",
            "switch_lang": "Switch to Chinese"
        }
    },
    zh: {
        translation: {
            "welcome": "欢迎使用 React",
            "subtitle": "编辑 src/App.tsx 并保存以查看热更新",
            "switch_lang": "切换为英文"
        }
    }
};

i18n
    // 检测用户语言
    .use(LanguageDetector)
    // 注入 react-i18next 实例
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'en', // 默认语言
        debug: true,

        interpolation: {
            escapeValue: false, // React 已经处理了 XSS
        }
    });

export default i18n;

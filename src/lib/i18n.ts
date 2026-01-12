import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// 翻译资源
const resources = {
    en: {
        translation: {
            "settings": "Settings",
            "language": "Language",
            "switch_lang": "Switch Language",
            "data_management": "Data Management",
            "backup_restore_desc": "Backup and restore your tags, todos and settings.",
            "export": "Export Data",
            "import": "Import Data",
            "restore_success": "Data restored successfully!",
            "restore_fail": "Failed to import data. Please check the file format.",
            "invalid_format": "Invalid backup file format."
        }
    },
    zh: {
        translation: {
            "settings": "设置",
            "language": "语言",
            "switch_lang": "切换语言",
            "data_management": "数据管理",
            "backup_restore_desc": "备份和恢复你的图标、待办事项及外观设置。",
            "export": "导出数据",
            "import": "导入数据",
            "restore_success": "数据恢复成功！",
            "restore_fail": "导入失败，请检查文件格式是否正确。",
            "invalid_format": "无效的备份文件格式。"
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

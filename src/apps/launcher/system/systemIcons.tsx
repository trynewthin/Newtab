import { Grid3x3, Palette, Plus, Settings, Timer, Bot, Download, Bookmark, History, Sparkles, FileText } from "lucide-react";

export type SystemIconName = "Settings" | "Palette" | "Plus" | "Grid3x3" | "Timer" | "Bot" | "Downloads" | "Bookmarks" | "History" | "Sparkles" | "FileText";

export function renderSystemIcon(iconName: string, className?: string) {
    switch (iconName) {
        case "Settings":
            return <Settings size={24} className={className} />;
        case "Palette":
            return <Palette size={24} className={className} />;
        case "Plus":
            return <Plus size={24} className={className} />;
        case "Grid3x3":
            return <Grid3x3 size={24} className={className} />;
        case "Timer":
            return <Timer size={24} className={className} />;
        case "Bot":
            return <Bot size={24} className={className} />;
        case "Downloads":
            return <Download size={24} className={className} />;
        case "Bookmarks":
            return <Bookmark size={24} className={className} />;
        case "History":
            return <History size={24} className={className} />;
        case "Sparkles":
            return <Sparkles size={24} className={className} />;
        case "FileText":
            return <FileText size={24} className={className} />;
        default:
            if (iconName.includes('/') || iconName.includes('.')) {
                return <img src={iconName} className={className} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} alt="" />;
            }
            return <span className={className}>{iconName}</span>;
    }
}

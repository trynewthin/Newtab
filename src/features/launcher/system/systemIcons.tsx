import { Grid3x3, Palette, Plus, Settings, Timer, ListTodo, Bot } from "lucide-react";

export type SystemIconName = "Settings" | "Palette" | "Plus" | "Grid3x3" | "Timer" | "ListTodo" | "Bot";

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
        case "ListTodo":
            return <ListTodo size={24} className={className} />;
        case "Bot":
            return <Bot size={24} className={className} />;
        default:
            if (iconName.includes('/') || iconName.includes('.')) {
                return <img src={iconName} className={className} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} alt="" />;
            }
            return <span className={className}>{iconName}</span>;
    }
}

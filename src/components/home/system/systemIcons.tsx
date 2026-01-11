import { Grid3x3, Palette, Plus, Settings, Timer } from "lucide-react";

export type SystemIconName = "Settings" | "Palette" | "Plus" | "Grid3x3" | "Timer";

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
        default:
            return <span className={className}>{iconName}</span>;
    }
}

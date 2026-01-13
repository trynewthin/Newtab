import type { SystemIconName } from "./systemIcons";
import pomodoroIcon from "@/assets/pomodoro-icon.png";
import todoIcon from "@/assets/todo-icon.png";
import settingsIcon from "@/assets/settings-icon.png";
import themeIcon from "@/assets/theme-icon.png";

export type SystemType = "settings" | "theme" | "add" | "icon-manager" | "pomodoro" | "todo";

export interface SystemItem {
    type: SystemType;
    title: string;
    icon: SystemIconName | string;
}

export const SYSTEM_ITEMS: SystemItem[] = [
    { type: "settings", title: "Settings", icon: settingsIcon },
    { type: "theme", title: "Theme", icon: themeIcon },

    { type: "icon-manager", title: "Icon Manager", icon: "Grid3x3" },
    { type: "pomodoro", title: "Pomodoro", icon: pomodoroIcon },
    { type: "todo", title: "Todo List", icon: todoIcon },
];

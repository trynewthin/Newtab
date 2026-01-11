import type { SystemIconName } from "./systemIcons";

export type SystemType = "settings" | "theme" | "add" | "icon-manager" | "pomodoro" | "todo";

export interface SystemItem {
    type: SystemType;
    title: string;
    icon: SystemIconName;
}

export const SYSTEM_ITEMS: SystemItem[] = [
    { type: "settings", title: "Settings", icon: "Settings" },
    { type: "theme", title: "Theme", icon: "Palette" },
    { type: "add", title: "Add", icon: "Plus" },
    { type: "icon-manager", title: "Icon Manager", icon: "Grid3x3" },
    { type: "pomodoro", title: "Pomodoro", icon: "Timer" },
    { type: "todo", title: "Todo List", icon: "ListTodo" },
];

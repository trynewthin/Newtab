import pomodoroIcon from "@/assets/pomodoro-icon.png";
import todoIcon from "@/assets/todo-icon.png";
import settingsIcon from "@/assets/settings-icon.png";
import aiIcon from "@/assets/ai-icon.png";
import downloadsIcon from "@/assets/downloads-icon.png";

export type SystemType = "settings" | "theme" | "add" | "icon-manager" | "pomodoro" | "todo" | "ai" | "downloads";

export interface SystemItem {
    type: SystemType;
    title: string;
    icon: string; // Simplified for simplicity since assets are strings
}

export const SYSTEM_ITEMS: SystemItem[] = [
    { type: "settings", title: "Settings", icon: settingsIcon },
    { type: "pomodoro", title: "Pomodoro", icon: pomodoroIcon },
    { type: "todo", title: "Todo List", icon: todoIcon },
    { type: "ai", title: "AI Assistant", icon: aiIcon },
    { type: "downloads", title: "Downloads", icon: downloadsIcon },
];

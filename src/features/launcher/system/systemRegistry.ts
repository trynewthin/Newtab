
export type SystemType = "settings" | "theme" | "add" | "icon-manager" | "pomodoro" | "todo" | "ai" | "downloads" | "bookmarks" | "history";

export interface SystemItem {
    type: SystemType;
    title: string;
    icon: string; // Simplified for simplicity since assets are strings
}

export const SYSTEM_ITEMS: SystemItem[] = [
    { type: "settings", title: "Settings", icon: "Settings" },
    { type: "pomodoro", title: "Pomodoro", icon: "Timer" },
    { type: "todo", title: "Todo List", icon: "ListTodo" },
    { type: "ai", title: "AI Assistant", icon: "Sparkles" },
    { type: "downloads", title: "Downloads", icon: "Downloads" },
    { type: "bookmarks", title: "Bookmarks", icon: "Bookmarks" },
    { type: "history", title: "History", icon: "History" },
];

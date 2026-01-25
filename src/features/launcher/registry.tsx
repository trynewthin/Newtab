import type { ComponentType } from "react";
import type { SystemAppItem } from "@/store/core/itemTypes";
import { SettingsAppIcon } from "@/features/settings/SettingsAppIcon";
import { TodoAppIcon } from "@/features/todo/TodoAppIcon";
import { PomodoroAppIcon } from "@/features/pomodoro/PomodoroAppIcon";
import { AiAppIcon } from "@/features/ai-companion/AiAppIcon";
import { DownloadsAppIcon } from "@/features/downloads/DownloadsAppIcon";
import { BookmarksAppIcon } from "@/features/bookmarks/BookmarksAppIcon";
import { HistoryAppIcon } from "@/features/history/HistoryAppIcon";

// Base props required for any App Icon Component
export interface AppIconProps {
    item: SystemAppItem;
    // DND & Interaction props usually passed by the Grid
    isOverlay?: boolean;
    isNearTarget?: boolean;
    isHoverTarget?: boolean;
    className?: string;
}

type AppRegistry = Record<string, ComponentType<any>>;

export const APP_REGISTRY: AppRegistry = {
    'settings': SettingsAppIcon,
    'todo': TodoAppIcon,
    'pomodoro': PomodoroAppIcon,
    'ai': AiAppIcon,
    'downloads': DownloadsAppIcon,
    'bookmarks': BookmarksAppIcon,
    'history': HistoryAppIcon,
};

export function getAppIconComponent(appId: string): ComponentType<any> | null {
    return APP_REGISTRY[appId] || null;
}

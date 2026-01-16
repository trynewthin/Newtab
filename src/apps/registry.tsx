import type { ComponentType } from "react";
import type { SystemAppItem } from "@/store/core/itemTypes";
import { SettingsAppIcon } from "@/apps/setting/SettingsAppIcon";
import { TodoAppIcon } from "@/apps/todo/TodoAppIcon";
import { PomodoroAppIcon } from "@/apps/pomodoro/PomodoroAppIcon";
import { AiAppIcon } from "@/apps/ai/AiAppIcon";

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
};

export function getAppIconComponent(appId: string): ComponentType<any> | null {
    return APP_REGISTRY[appId] || null;
}

// Core Data Models

export interface Tag {
    id: string;
    title: string;
    url: string;
    icon?: string;
    iconDataUrl?: string; // 本地缓存的 favicon DataURL
    backgroundColor?: string; // Cache the dominant color of the icon
    iconSize?: number; // Icon scaling factor (0.1 - 2.0, default 1.0)
    isSystem?: boolean; // 标记是否为系统图标
    type?: 'normal' | 'settings' | 'theme' | 'add' | 'icon-manager' | 'pomodoro' | 'todo' | 'folder';
    isFolder?: boolean;
    children?: Tag[];
}

export interface Todo {
    id: string;
    text: string;
    completed: boolean;
    createdAt: number;
}

export interface BackgroundConfig {
    type: 'solid' | 'gradient' | 'image';
    value: string;
    blur?: number;
    overlay?: number; // 0-100
}

export interface PomodoroConfig {
    workMinutes: number;
    breakMinutes: number;
    rounds: number;

    enablePrepare: boolean;
    prepareMinutes: number;

    enableLongBreak: boolean;
    longBreakInterval: number;
    longBreakMinutes: number;
}

export interface PomodoroStatus {
    isRunning: boolean;
    mode: 'work' | 'break' | 'prepare' | 'long-break';
    endTime: number | null;
    currentRound: number;
}

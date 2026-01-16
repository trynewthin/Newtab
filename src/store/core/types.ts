// Core Data Models

export interface Todo {
    id: string;
    text: string;
    completed: boolean;
    createdAt: number;
    date?: string; // YYYY-MM-DD
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

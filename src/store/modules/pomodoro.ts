import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createPersistConfig } from '../core/storage';
import { type PomodoroConfig, type PomodoroStatus } from '../core/types';

interface PomodoroState {
    config: PomodoroConfig;
    status: PomodoroStatus;

    setConfig: (config: Partial<PomodoroConfig>) => void;
    setStatus: (status: Partial<PomodoroStatus>) => void;

    // Actions
    reset: () => void;
}

const DEFAULT_CONFIG: PomodoroConfig = {
    workMinutes: 25,
    breakMinutes: 5,
    rounds: 4,
    enablePrepare: false,
    prepareMinutes: 1,
    enableLongBreak: false,
    longBreakInterval: 4,
    longBreakMinutes: 15,
};

const INITIAL_STATUS: PomodoroStatus = {
    isRunning: false,
    mode: 'work',
    endTime: null,
    currentRound: 1,
};

export const usePomodoroStore = create<PomodoroState>()(
    persist(
        (set) => ({
            config: DEFAULT_CONFIG,
            status: INITIAL_STATUS,

            setConfig: (config) => set((state) => ({
                config: { ...state.config, ...config }
            })),

            setStatus: (status) => set((state) => ({
                status: { ...state.status, ...status }
            })),

            reset: () => set({ status: INITIAL_STATUS }),
        }),
        createPersistConfig('app-pomodoro')
    )
);

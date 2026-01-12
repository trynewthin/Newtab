import type { StateCreator } from 'zustand';
import { type AppState, type ConfigState } from '../types';

export const createConfigSlice: StateCreator<AppState, [], [], ConfigState> = (set) => ({
    theme: 'system',
    isFirstRun: true,
    isEditing: false,
    searchEngine: 'google',

    setTheme: (theme) => set({ theme }),
    setFirstRun: (status) => set({ isFirstRun: status }),
    setEditing: (status) => set({ isEditing: status }),
    setSearchEngine: (engine) => set({ searchEngine: engine }),

    primaryColor: 'hsl(221.2 83.2% 53.3%)', // Default Blue
    backgroundConfig: {
        type: 'solid',
        value: 'hsl(240 10% 3.9%)', // Default background
    },
    solidColors: [
        'hsl(224 71% 4%)', // Default Deep Blue/Black
        'hsl(0 0% 5%)',    // Minimal Black
    ],
    addSolidColor: (color) => set((state) => ({
        solidColors: [...state.solidColors, color]
    })),
    removeSolidColor: (color) => set((state) => ({
        solidColors: state.solidColors.filter(c => c !== color)
    })),
    setPrimaryColor: (color) => set({ primaryColor: color }),
    setBackgroundConfig: (config) => set((state) => ({
        backgroundConfig: { ...state.backgroundConfig, ...config }
    })),

    pomodoroConfig: {
        workMinutes: 25,
        breakMinutes: 5,
        rounds: 4,
        enablePrepare: false,
        prepareMinutes: 1,
        enableLongBreak: false,
        longBreakInterval: 4,
        longBreakMinutes: 15,
    },
    pomodoroStatus: {
        isRunning: false,
        mode: 'work',
        endTime: null,
        currentRound: 1,
    },
    setPomodoroConfig: (config) => set({ pomodoroConfig: config }),
    setPomodoroStatus: (status) => set({ pomodoroStatus: status }),
});

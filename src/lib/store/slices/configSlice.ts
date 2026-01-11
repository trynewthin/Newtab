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
    setPrimaryColor: (color) => set({ primaryColor: color }),
    setBackgroundConfig: (config) => set((state) => ({
        backgroundConfig: { ...state.backgroundConfig, ...config }
    })),
});

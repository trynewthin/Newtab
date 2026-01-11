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
});

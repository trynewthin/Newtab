import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createPersistConfig } from '../core/storage';
import { type BackgroundConfig } from '../core/types';

interface SettingsState {
    // Theme & Appearance
    theme: 'light' | 'dark' | 'system';
    setTheme: (theme: 'light' | 'dark' | 'system') => void;

    primaryColor: string;
    setPrimaryColor: (color: string) => void;

    backgroundConfig: BackgroundConfig;
    setBackgroundConfig: (config: Partial<BackgroundConfig>) => void;

    solidColors: string[];
    addSolidColor: (color: string) => void;
    removeSolidColor: (color: string) => void;

    // General Config
    isFirstRun: boolean;
    setFirstRun: (status: boolean) => void;

    searchEngine: string;
    setSearchEngine: (engine: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            theme: 'system',
            setTheme: (theme) => set({ theme }),

            primaryColor: 'hsl(221.2 83.2% 53.3%)',
            setPrimaryColor: (color) => set({ primaryColor: color }),

            backgroundConfig: {
                type: 'solid',
                value: 'hsl(240 10% 3.9%)',
            },
            setBackgroundConfig: (config) => set((state) => ({
                backgroundConfig: { ...state.backgroundConfig, ...config }
            })),

            solidColors: [
                'hsl(224 71% 4%)', // Deep Blue/Black
                'hsl(0 0% 5%)',    // Minimal Black
            ],
            addSolidColor: (color) => set((state) => ({
                solidColors: [...state.solidColors, color]
            })),
            removeSolidColor: (color) => set((state) => ({
                solidColors: state.solidColors.filter((c) => c !== color)
            })),

            isFirstRun: true,
            setFirstRun: (status) => set({ isFirstRun: status }),

            searchEngine: 'google',
            setSearchEngine: (engine) => set({ searchEngine: engine }),
        }),
        createPersistConfig('app-settings')
    )
);

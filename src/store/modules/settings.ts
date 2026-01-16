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

    customSearchEngines: Array<{ name: string; value: string; url: string; icon?: string }>;
    addCustomSearchEngine: (engine: { name: string; value: string; url: string; icon?: string }) => void;
    removeCustomSearchEngine: (value: string) => void;
    updateCustomSearchEngine: (value: string, engine: Partial<{ name: string; url: string; icon?: string }>) => void;
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            theme: 'light',
            setTheme: (theme) => set({ theme }),

            primaryColor: 'hsl(217 91% 60%)', // Blue as default
            setPrimaryColor: (color) => set({ primaryColor: color }),

            backgroundConfig: {
                type: 'gradient',
                value: 'linear-gradient(to bottom right, #1e3a8a, #06b6d4)', // Ocean as default
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

            customSearchEngines: [],
            addCustomSearchEngine: (engine) => set((state) => ({
                customSearchEngines: [...state.customSearchEngines, engine]
            })),
            removeCustomSearchEngine: (value) => set((state) => ({
                customSearchEngines: state.customSearchEngines.filter((e) => e.value !== value),
                // If the deleted engine was the selected one, fallback to google
                searchEngine: state.searchEngine === value ? 'google' : state.searchEngine
            })),
            updateCustomSearchEngine: (value, engine) => set((state) => ({
                customSearchEngines: state.customSearchEngines.map((e) =>
                    e.value === value ? { ...e, ...engine } : e
                )
            })),
        }),
        createPersistConfig('app-settings')
    )
);

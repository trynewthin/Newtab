import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';

// 1. 创建 Chrome Storage 适配器
const storageAdapter: StateStorage = {
    getItem: async (name: string): Promise<string | null> => {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            const data = await chrome.storage.local.get(name);
            return (data[name] as string) || null;
        }
        return localStorage.getItem(name);
    },
    setItem: async (name: string, value: string): Promise<void> => {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            await chrome.storage.local.set({ [name]: value });
        } else {
            localStorage.setItem(name, value);
        }
    },
    removeItem: async (name: string): Promise<void> => {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            await chrome.storage.local.remove(name);
        } else {
            localStorage.removeItem(name);
        }
    },
};


// 2. 定义 Store 的类型
export interface Tag {
    id: string;
    title: string;
    url: string;
    icon?: string;
}

interface AppState {
    theme: 'light' | 'dark' | 'system';
    isFirstRun: boolean;
    searchEngine: string;
    tags: Tag[];

    setTheme: (theme: 'light' | 'dark' | 'system') => void;
    setFirstRun: (status: boolean) => void;
    setSearchEngine: (engine: string) => void;
    addTag: (tag: Omit<Tag, 'id'>) => void;
    updateTag: (id: string, tag: Partial<Omit<Tag, 'id'>>) => void;
    removeTag: (id: string) => void;
}

// 3. 创建 Store
export const useAppStore = create<AppState>()(
    persist(
        (set) => ({
            // Initial State
            theme: 'system',
            isFirstRun: true,
            searchEngine: 'google',
            tags: [
                { id: '1', title: 'Google', url: 'https://www.google.com' },
                { id: '2', title: 'GitHub', url: 'https://github.com' },
                { id: '3', title: 'YouTube', url: 'https://www.youtube.com' },
            ],

            // Actions
            setTheme: (theme) => set({ theme }),
            setFirstRun: (status) => set({ isFirstRun: status }),
            setSearchEngine: (engine) => set({ searchEngine: engine }),
            addTag: (tag) => set((state) => ({
                tags: [...state.tags, { ...tag, id: crypto.randomUUID() }]
            })),
            updateTag: (id, updatedFields) => set((state) => ({
                tags: state.tags.map((t) => t.id === id ? { ...t, ...updatedFields } : t)
            })),
            removeTag: (id) => set((state) => ({
                tags: state.tags.filter((t) => t.id !== id)
            })),
        }),
        {
            name: 'app-storage',
            storage: createJSONStorage(() => storageAdapter),
        }
    )
);

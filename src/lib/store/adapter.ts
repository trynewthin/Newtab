import { type StateStorage } from 'zustand/middleware';

export const storageAdapter: StateStorage = {
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

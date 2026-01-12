import { type StateStorage } from 'zustand/middleware';

/**
 * Storage adapter for Zustand persist middleware.
 * Uses localStorage by default.
 * Can be swapped for chrome.storage.local if async storage is preferred.
 */
export const storageAdapter: StateStorage = {
    getItem: (name: string): string | null => {
        try {
            return localStorage.getItem(name);
        } catch (e) {
            console.error('Error getting item from localStorage:', e);
            return null;
        }
    },
    setItem: (name: string, value: string): void => {
        try {
            localStorage.setItem(name, value);
        } catch (e) {
            console.error('Error setting item in localStorage:', e);
        }
    },
    removeItem: (name: string): void => {
        try {
            localStorage.removeItem(name);
        } catch (e) {
            console.error('Error removing item from localStorage:', e);
        }
    },
};

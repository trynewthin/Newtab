import { createJSONStorage, type StateStorage, type PersistOptions } from 'zustand/middleware';
import { storageRegistry } from '../persistence/registry';

/**
 * Storage adapter for Zustand persist middleware.
 * Uses localStorage by default.
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

/**
 * Helper to create persistence configuration.
 * Automatically registers the store in the unified storage registry.
 */
export const createPersistConfig = (name: string, options?: Partial<PersistOptions<any>>): PersistOptions<any> => {
    // Automatically register this store with the unified registry
    storageRegistry.register({
        key: name,
        type: 'localStorage',
        version: options?.version
    });

    return {
        name,
        storage: createJSONStorage(() => storageAdapter),
        ...options,
    };
};

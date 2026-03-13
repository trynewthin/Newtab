import { createJSONStorage } from "zustand/middleware";
import type { PersistOptions, StateStorage } from "zustand/middleware";
import { storageRegistry } from "./registry";

export const storageAdapter: StateStorage = {
    getItem: (name: string): string | null => {
        try {
            return localStorage.getItem(name);
        } catch (error) {
            console.error("Error getting item from localStorage:", error);
            return null;
        }
    },
    setItem: (name: string, value: string): void => {
        try {
            localStorage.setItem(name, value);
        } catch (error) {
            console.error("Error setting item in localStorage:", error);
        }
    },
    removeItem: (name: string): void => {
        try {
            localStorage.removeItem(name);
        } catch (error) {
            console.error("Error removing item from localStorage:", error);
        }
    },
};

export const createPersistConfig = (
    name: string,
    options?: Partial<PersistOptions<any>>
): PersistOptions<any> => {
    storageRegistry.register({
        key: name,
        type: "localStorage",
        version: options?.version,
    });

    return {
        name,
        storage: createJSONStorage(() => storageAdapter),
        ...options,
    };
};

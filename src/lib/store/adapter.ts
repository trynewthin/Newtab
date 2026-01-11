import { type StateStorage } from 'zustand/middleware';
import { backgroundStorage, isDataURL } from './backgroundStorage';

export const storageAdapter: StateStorage = {
    getItem: async (name: string): Promise<string | null> => {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            const data = await chrome.storage.local.get(name);
            let result = (data[name] as string) || null;

            // If we have a background config, check if we need to load from IndexedDB
            if (result && name === 'app-storage') {
                try {
                    const parsed = JSON.parse(result);
                    if (parsed.state?.backgroundConfig?.value) {
                        const bgValue = parsed.state.backgroundConfig.value;
                        // Check if it's a reference to IndexedDB
                        if (bgValue.startsWith('idb://')) {
                            const key = bgValue.replace('idb://', '');
                            const actualValue = await backgroundStorage.getBackground(key);
                            if (actualValue) {
                                parsed.state.backgroundConfig.value = actualValue;
                                result = JSON.stringify(parsed);
                            }
                        }
                    }
                } catch (e) {
                    console.error('Error loading background from IndexedDB:', e);
                }
            }

            return result;
        }
        return localStorage.getItem(name);
    },

    setItem: async (name: string, value: string): Promise<void> => {
        let finalValue = value;

        // Check if we're storing app-storage with a large background image
        if (name === 'app-storage') {
            try {
                const parsed = JSON.parse(value);
                if (parsed.state?.backgroundConfig?.value) {
                    const bgValue = parsed.state.backgroundConfig.value;

                    // If it's a data URL and large, store in IndexedDB
                    if (isDataURL(bgValue)) {
                        const bgKey = `bg_${Date.now()}`;
                        await backgroundStorage.saveBackground(bgKey, bgValue);
                        // Replace with reference
                        parsed.state.backgroundConfig.value = `idb://${bgKey}`;
                        finalValue = JSON.stringify(parsed);
                    }
                }
            } catch (e) {
                console.error('Error saving background to IndexedDB:', e);
            }
        }

        if (typeof chrome !== 'undefined' && chrome.storage) {
            try {
                await chrome.storage.local.set({ [name]: finalValue });
            } catch (error) {
                console.error('Chrome storage error:', error);
                // Fallback to localStorage if chrome storage fails
                localStorage.setItem(name, finalValue);
            }
        } else {
            localStorage.setItem(name, finalValue);
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

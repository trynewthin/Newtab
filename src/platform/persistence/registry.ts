export type StorageType = 'localStorage' | 'indexedDB';

export interface StoreConfig {
    key: string;
    type: StorageType;
    description?: string;
    version?: number;
    // Callback to rehydrate the store if it's a zustand store
    rehydrate?: () => void;
}

class StorageRegistry {
    private stores = new Map<string, StoreConfig>();

    /**
     * Register a storage key to be managed by the unified data layer.
     */
    register(config: StoreConfig) {
        if (this.stores.has(config.key)) {
            // Updated: Merge config if rehydrate is provided later
            const existing = this.stores.get(config.key)!;
            if (config.rehydrate) {
                existing.rehydrate = config.rehydrate;
            }
            return;
        }
        this.stores.set(config.key, config);
    }

    /**
     * Bind a rehydration function to a registered key.
     * This allows us to link the store instance to the registry after creation.
     */
    registerRehydrator(key: string, rehydrate: () => void) {
        const config = this.stores.get(key);
        if (config) {
            config.rehydrate = rehydrate;
        } else {
            // Pre-register if the store hasn't initialized its persistence config yet (rare but safe)
            this.stores.set(key, { key, type: 'localStorage', rehydrate });
        }
    }


    get(key: string) {
        return this.stores.get(key);
    }

    getAll() {
        return Array.from(this.stores.values());
    }

    getConfigsByType(type: StorageType) {
        return this.getAll().filter(s => s.type === type);
    }
}

export const storageRegistry = new StorageRegistry();

/**
 * IndexedDB wrapper for storing large files like background images
 */

const DB_NAME = 'newtab-storage';
const DB_VERSION = 2;
const STORE_NAME = 'backgrounds';
const ICON_STORE_NAME = 'icons';

class BackgroundStorage {
    private db: IDBDatabase | null = null;

    async init(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME);
                }
                if (!db.objectStoreNames.contains(ICON_STORE_NAME)) {
                    db.createObjectStore(ICON_STORE_NAME);
                }
            };
        });
    }

    async getIcon(key: string): Promise<string | null> {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([ICON_STORE_NAME], 'readonly');
            const store = transaction.objectStore(ICON_STORE_NAME);
            const request = store.get(key);

            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    }

    async saveBackground(key: string, value: string): Promise<void> {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.put(value, key);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async deleteIcon(key: string): Promise<void> {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([ICON_STORE_NAME], 'readwrite');
            const store = transaction.objectStore(ICON_STORE_NAME);
            const request = store.delete(key);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async saveIcon(key: string, value: string): Promise<void> {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([ICON_STORE_NAME], 'readwrite');
            const store = transaction.objectStore(ICON_STORE_NAME);
            const request = store.put(value, key);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async getBackground(key: string): Promise<string | null> {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(key);

            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    }

    async deleteBackground(key: string): Promise<void> {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.delete(key);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    private async getStoreEntries(storeName: string): Promise<Record<string, string>> {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.openCursor();
            const result: Record<string, string> = {};

            request.onsuccess = () => {
                const cursor = request.result;
                if (cursor) {
                    const key = String(cursor.key);
                    const value = cursor.value;
                    if (typeof value === "string") {
                        result[key] = value;
                    }
                    cursor.continue();
                    return;
                }
                resolve(result);
            };

            request.onerror = () => reject(request.error);
        });
    }

    private async clearStores(storeNames: string[]): Promise<void> {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(storeNames, 'readwrite');
            for (const storeName of storeNames) {
                transaction.objectStore(storeName).clear();
            }
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    }

    private async putEntries(
        storeName: string,
        entries: Record<string, string>
    ): Promise<void> {
        if (!this.db) await this.init();
        const pairs = Object.entries(entries);
        if (pairs.length === 0) return;

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            for (const [key, value] of pairs) {
                store.put(value, key);
            }
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    }

    async exportAll(): Promise<{ backgrounds: Record<string, string>; icons: Record<string, string> }> {
        const [backgrounds, icons] = await Promise.all([
            this.getStoreEntries(STORE_NAME),
            this.getStoreEntries(ICON_STORE_NAME),
        ]);

        return { backgrounds, icons };
    }

    async importAll(
        payload: Partial<{ backgrounds: Record<string, string>; icons: Record<string, string> }>,
        options?: { replace?: boolean }
    ): Promise<void> {
        const replace = options?.replace ?? true;
        const backgrounds = payload.backgrounds ?? {};
        const icons = payload.icons ?? {};

        if (replace) {
            await this.clearStores([STORE_NAME, ICON_STORE_NAME]);
        }

        await Promise.all([
            this.putEntries(STORE_NAME, backgrounds),
            this.putEntries(ICON_STORE_NAME, icons),
        ]);
    }
}

export const backgroundStorage = new BackgroundStorage();

/**
 * Helper to check if a value is a data URL
 */
export function isDataURL(value: string): boolean {
    return value.startsWith('data:');
}

/**
 * Generate a unique key for storing background images
 */
export function getBackgroundKey(): string {
    // Use a timestamp-based key for uniqueness
    return `bg_${Date.now()}`;
}

export function getIconKey(): string {
    return `icon_${Date.now()}`;
}

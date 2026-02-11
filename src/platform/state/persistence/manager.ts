import JSZip from "jszip";
import { entries, setMany, clear } from "idb-keyval"; // Default KV store (AI History)
import { storageRegistry } from "./registry";

const BACKUP_VERSION = "3.0.0"; // Major version for new item architecture
export const FILE_EXTENSION = ".ntb";

export interface BackupMetadata {
    version: string;
    appVersion: string;
    exportDate: string;
}

export const persistenceManager = {
    /**
     * Export all data (LocalStorage + IndexedDBs)
     */
    async exportData(appVersion: string): Promise<Blob> {
        const zip = new JSZip();

        // 1. Metadata
        const metadata: BackupMetadata = {
            version: BACKUP_VERSION,
            appVersion,
            exportDate: new Date().toISOString(),
        };
        zip.file("metadata.json", JSON.stringify(metadata, null, 2));

        // 2. LocalStorage (Managed by Registry)
        const storageData: Record<string, string> = {};
        const registeredStores = storageRegistry.getAll();

        for (const config of registeredStores) {
            if (config.type === 'localStorage') {
                const val = localStorage.getItem(config.key);
                if (val) storageData[config.key] = val;
            }
        }

        // Manual fallback for specific known keys
        const scanKeys = ['i18nextLng'];
        scanKeys.forEach(key => {
            const val = localStorage.getItem(key);
            if (val) storageData[key] = val;
        });

        zip.file("storage.json", JSON.stringify(storageData, null, 2));

        // 3. IndexedDB - KeyVal Store (AI History)
        const kvEntries = await entries();
        const kvData = Object.fromEntries(kvEntries);
        zip.file("idb-kv.json", JSON.stringify(kvData, null, 2));

        return await zip.generateAsync({
            type: "blob",
            compression: "DEFLATE",
            compressionOptions: { level: 9 }
        });
    },

    /**
     * Import data and restore state
     */
    async importData(file: File): Promise<boolean> {
        const zip = await JSZip.loadAsync(file);

        // 1. Metadata Check
        const metadataFile = zip.file("metadata.json");
        if (!metadataFile) throw new Error("Invalid backup: missing metadata");

        // 2. Restore LocalStorage
        const storageFile = zip.file("storage.json");
        if (storageFile) {
            const data = JSON.parse(await storageFile.async("string"));

            // Clear currently registered store keys to ensure clean state
            const registeredKeys = storageRegistry.getAll().map(s => s.key);
            registeredKeys.forEach(key => localStorage.removeItem(key));

            // Restore
            for (const [key, value] of Object.entries(data)) {
                localStorage.setItem(key, value as string);
            }
        }

        // 3. Restore IDB KeyVal
        const kvFile = zip.file("idb-kv.json") || zip.file("indexeddb.json");
        if (kvFile) {
            await clear();
            const data = JSON.parse(await kvFile.async("string"));
            await setMany(Object.entries(data));
        }

        return true;
    },

    /**
     * Trigger browser download of the backup blob
     */
    downloadBackup(blob: Blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        const dateStr = new Date().toISOString().split('T')[0];
        a.href = url;
        a.download = `newtab-backup-${dateStr}${FILE_EXTENSION}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
};

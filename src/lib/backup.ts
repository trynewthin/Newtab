import JSZip from "jszip";
import { entries, setMany, clear } from "idb-keyval";
import { APP_METADATA } from "./constants";

const BACKUP_VERSION = "1.1.0"; // Increment version due to IndexedDB support
const FILE_EXTENSION = ".ntb"; // New Tab Backup

/**
 * Common keys used by the application in localStorage
 */
const STORAGE_KEYS = [
    "app-settings",
    "app-tags",
    "app-todos",
    "app-pomodoro",
    "app-ai-meta-storage", // Corrected key for AI models and sessions
    "i18nextLng"
];

/**
 * Export all application data to a compressed file
 */
export async function exportFullData() {
    try {
        const zip = new JSZip();

        // 1. Collect localStorage data
        const storage: Record<string, string> = {};
        for (const key of STORAGE_KEYS) {
            const value = localStorage.getItem(key);
            if (value) {
                storage[key] = value;
            }
        }

        // 2. Collect IndexedDB data (AI Chat History)
        const idbEntries = await entries();
        const indexeddbData = Object.fromEntries(idbEntries);

        // 3. Create metadata
        const metadata = {
            version: BACKUP_VERSION,
            appVersion: APP_METADATA.version,
            exportDate: new Date().toISOString(),
        };

        // 4. Add files to zip
        zip.file("metadata.json", JSON.stringify(metadata, null, 2));
        zip.file("storage.json", JSON.stringify(storage, null, 2));
        zip.file("indexeddb.json", JSON.stringify(indexeddbData, null, 2));

        // 5. Generate zip blob
        const blob = await zip.generateAsync({
            type: "blob",
            compression: "DEFLATE",
            compressionOptions: {
                level: 9
            }
        });

        // 6. Download file
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        const dateStr = new Date().toISOString().split('T')[0];
        a.href = url;
        a.download = `newtab-backup-${dateStr}${FILE_EXTENSION}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        return true;
    } catch (error) {
        console.error("Export failed:", error);
        throw error;
    }
}

/**
 * Import application data from a compressed file
 */
export async function importFullData(file: File) {
    try {
        const zip = await JSZip.loadAsync(file);

        // 1. Read metadata
        const metadataFile = zip.file("metadata.json");
        if (!metadataFile) {
            throw new Error("Invalid backup file: missing metadata.json");
        }

        const metadataJson = await metadataFile.async("string");
        const metadata = JSON.parse(metadataJson);

        // Basic validation
        if (!metadata.version) {
            throw new Error("Invalid backup file: missing version info");
        }

        // 2. Clear existing application keys to ensure clean restore
        STORAGE_KEYS.forEach(key => localStorage.removeItem(key));
        await clear(); // Clear IndexedDB (AI histories)

        // 3. Restore localStorage data
        const storageFile = zip.file("storage.json");
        if (storageFile) {
            const storageJson = await storageFile.async("string");
            const storage: Record<string, string> = JSON.parse(storageJson);
            for (const [key, value] of Object.entries(storage)) {
                if (STORAGE_KEYS.includes(key)) {
                    localStorage.setItem(key, value);
                }
            }
        }

        // 4. Restore IndexedDB data if present (Backwards compatibility with v1.0.0 backup)
        const idbFile = zip.file("indexeddb.json");
        if (idbFile) {
            const idbJson = await idbFile.async("string");
            const idbData: Record<string, any> = JSON.parse(idbJson);
            const idbEntries = Object.entries(idbData);
            if (idbEntries.length > 0) {
                await setMany(idbEntries);
            }
        }

        return true;
    } catch (error) {
        console.error("Import failed:", error);
        throw error;
    }
}

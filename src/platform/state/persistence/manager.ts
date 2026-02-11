import JSZip from "jszip";
import {
    clear,
    entries,
    setMany,
} from "idb-keyval";
import { backgroundStorage } from "@/platform/state/core/backgroundStorage";
import { storageRegistry } from "./registry";

const DATA_ARCHIVE_FORMAT = "newtab-data-archive";
const DATA_ARCHIVE_SCHEMA_VERSION = 1;
const DATA_ARCHIVE_EXTENSION = ".ntb";
const INDEXED_DB_IDB_KEYVAL_VERSION = 1;
const INDEXED_DB_BACKGROUND_STORAGE_VERSION = 2;

const LEGACY_JSON_FALLBACK = "indexeddb.json";
const LEGACY_STORAGE_FILE = "storage.json";
const LEGACY_IDB_FILE = "idb-kv.json";

const EXPLICIT_LOCAL_STORAGE_KEYS = [
    "i18nextLng",
    "app-ai-meta-storage",
];
const DEPRECATED_LOCAL_STORAGE_KEYS = new Set([
    "paper-storage",
]);

export interface DataArchiveManifest {
    format: typeof DATA_ARCHIVE_FORMAT;
    schemaVersion: number;
    appVersion: string;
    exportDate: string;
    snapshotId: string;
    storeVersions: Record<string, number>;
}

export interface DataArchivePayload {
    localStorage: Record<string, string>;
    idbKeyval: Record<string, unknown>;
    backgroundStorage: {
        backgrounds: Record<string, string>;
        icons: Record<string, string>;
    };
}

export interface DataArchiveBundle {
    manifest: DataArchiveManifest;
    payload: DataArchivePayload;
}

export interface BackupInspectionResult {
    appVersion: string;
    exportDate: string;
    sourceFormat: "modern" | "legacy";
    sourceSchemaVersion: number;
    targetSchemaVersion: number;
    requiresMigration: boolean;
    supported: boolean;
    reason?: string;
}

function collectManagedLocalStorageKeys(): string[] {
    const keys = new Set<string>(EXPLICIT_LOCAL_STORAGE_KEYS);

    for (const config of storageRegistry.getConfigsByType("localStorage")) {
        keys.add(config.key);
    }

    for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i);
        if (!key) continue;
        if (DEPRECATED_LOCAL_STORAGE_KEYS.has(key)) continue;
        if (key.startsWith("app-") || key.endsWith("-storage")) {
            keys.add(key);
        }
    }

    return Array.from(keys).filter((key) => !DEPRECATED_LOCAL_STORAGE_KEYS.has(key));
}

function collectStoreVersions(): Record<string, number> {
    const versions: Record<string, number> = {};

    for (const config of storageRegistry.getConfigsByType("localStorage")) {
        versions[`localStorage:${config.key}`] = config.version ?? 1;
    }

    versions["indexedDB:idb-keyval"] = INDEXED_DB_IDB_KEYVAL_VERSION;
    versions["indexedDB:background-storage"] = INDEXED_DB_BACKGROUND_STORAGE_VERSION;
    return versions;
}

async function buildPayload(): Promise<DataArchivePayload> {
    const localStorageData: Record<string, string> = {};
    for (const key of collectManagedLocalStorageKeys()) {
        const value = localStorage.getItem(key);
        if (value !== null) {
            localStorageData[key] = value;
        }
    }

    const kvEntries = await entries();
    const idbData = Object.fromEntries(kvEntries);
    const bgData = await backgroundStorage.exportAll();

    return {
        localStorage: localStorageData,
        idbKeyval: idbData,
        backgroundStorage: {
            backgrounds: bgData.backgrounds,
            icons: bgData.icons,
        },
    };
}

function createManifest(appVersion: string): DataArchiveManifest {
    return {
        format: DATA_ARCHIVE_FORMAT,
        schemaVersion: DATA_ARCHIVE_SCHEMA_VERSION,
        appVersion,
        exportDate: new Date().toISOString(),
        snapshotId: crypto.randomUUID(),
        storeVersions: collectStoreVersions(),
    };
}

async function bundleToZip(bundle: DataArchiveBundle): Promise<Blob> {
    const zip = new JSZip();
    zip.file("metadata.json", JSON.stringify(bundle.manifest, null, 2));
    zip.file("payload/local-storage.json", JSON.stringify(bundle.payload.localStorage, null, 2));
    zip.file("payload/idb-keyval.json", JSON.stringify(bundle.payload.idbKeyval, null, 2));
    zip.file("payload/background-storage.json", JSON.stringify(bundle.payload.backgroundStorage, null, 2));

    return zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 9 },
    });
}

function parseJsonOrEmpty(raw: string | null): Record<string, unknown> {
    if (!raw) return {};
    try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
            return parsed as Record<string, unknown>;
        }
        return {};
    } catch {
        return {};
    }
}

function toStringRecord(input: Record<string, unknown>): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(input)) {
        if (typeof value === "string") {
            result[key] = value;
        }
    }
    return result;
}

async function parseModernBundle(zip: JSZip, manifest: DataArchiveManifest): Promise<DataArchiveBundle> {
    const localStorageRaw = await zip.file("payload/local-storage.json")?.async("string") ?? null;
    const idbRaw = await zip.file("payload/idb-keyval.json")?.async("string") ?? null;
    const backgroundRaw = await zip.file("payload/background-storage.json")?.async("string") ?? null;

    const localStorageData = toStringRecord(parseJsonOrEmpty(localStorageRaw));
    const idbData = parseJsonOrEmpty(idbRaw);
    const backgroundData = parseJsonOrEmpty(backgroundRaw);
    const backgrounds = toStringRecord((backgroundData.backgrounds as Record<string, unknown>) || {});
    const icons = toStringRecord((backgroundData.icons as Record<string, unknown>) || {});

    return {
        manifest,
        payload: {
            localStorage: localStorageData,
            idbKeyval: idbData,
            backgroundStorage: {
                backgrounds,
                icons,
            },
        },
    };
}

async function parseLegacyBundle(zip: JSZip): Promise<DataArchiveBundle> {
    const metadataRaw = await zip.file("metadata.json")?.async("string") ?? "{}";
    const metadata = parseJsonOrEmpty(metadataRaw);
    const storageRaw = await zip.file(LEGACY_STORAGE_FILE)?.async("string") ?? null;
    const idbRaw =
        await zip.file(LEGACY_IDB_FILE)?.async("string")
        ?? await zip.file(LEGACY_JSON_FALLBACK)?.async("string")
        ?? null;

    const appVersion = typeof metadata.appVersion === "string" ? metadata.appVersion : "legacy";
    const exportDate = typeof metadata.exportDate === "string" ? metadata.exportDate : new Date().toISOString();

    return {
        manifest: {
            format: DATA_ARCHIVE_FORMAT,
            schemaVersion: DATA_ARCHIVE_SCHEMA_VERSION,
            appVersion,
            exportDate,
            snapshotId: crypto.randomUUID(),
            storeVersions: {
                "indexedDB:idb-keyval": INDEXED_DB_IDB_KEYVAL_VERSION,
            },
        },
        payload: {
            localStorage: toStringRecord(parseJsonOrEmpty(storageRaw)),
            idbKeyval: parseJsonOrEmpty(idbRaw),
            backgroundStorage: {
                backgrounds: {},
                icons: {},
            },
        },
    };
}

async function parseArchive(file: File): Promise<DataArchiveBundle> {
    const zip = await JSZip.loadAsync(file);
    const metadataRaw = await zip.file("metadata.json")?.async("string");
    if (!metadataRaw) {
        throw new Error("Invalid backup: missing metadata.json");
    }

    const metadata = parseJsonOrEmpty(metadataRaw);
    const isModern =
        metadata.format === DATA_ARCHIVE_FORMAT
        && typeof metadata.schemaVersion === "number";

    if (isModern) {
        const manifest = metadata as unknown as DataArchiveManifest;
        return parseModernBundle(zip, manifest);
    }

    return parseLegacyBundle(zip);
}

async function inspectArchive(file: File): Promise<BackupInspectionResult> {
    const zip = await JSZip.loadAsync(file);
    const metadataRaw = await zip.file("metadata.json")?.async("string");
    if (!metadataRaw) {
        throw new Error("Invalid backup: missing metadata.json");
    }

    const metadata = parseJsonOrEmpty(metadataRaw);
    const isModern =
        metadata.format === DATA_ARCHIVE_FORMAT
        && typeof metadata.schemaVersion === "number";

    if (isModern) {
        const sourceSchemaVersion = Number(metadata.schemaVersion);
        const supported = sourceSchemaVersion <= DATA_ARCHIVE_SCHEMA_VERSION;
        return {
            appVersion: typeof metadata.appVersion === "string" ? metadata.appVersion : "unknown",
            exportDate: typeof metadata.exportDate === "string" ? metadata.exportDate : "",
            sourceFormat: "modern",
            sourceSchemaVersion,
            targetSchemaVersion: DATA_ARCHIVE_SCHEMA_VERSION,
            requiresMigration: sourceSchemaVersion < DATA_ARCHIVE_SCHEMA_VERSION,
            supported,
            reason: supported ? undefined : `schema-too-new:${sourceSchemaVersion}`,
        };
    }

    return {
        appVersion: typeof metadata.appVersion === "string" ? metadata.appVersion : "legacy",
        exportDate: typeof metadata.exportDate === "string" ? metadata.exportDate : "",
        sourceFormat: "legacy",
        sourceSchemaVersion: 0,
        targetSchemaVersion: DATA_ARCHIVE_SCHEMA_VERSION,
        requiresMigration: true,
        supported: true,
    };
}

function normalizeBundle(bundle: DataArchiveBundle): DataArchiveBundle {
    if (bundle.manifest.schemaVersion > DATA_ARCHIVE_SCHEMA_VERSION) {
        throw new Error(
            `Backup schema ${bundle.manifest.schemaVersion} is newer than supported ${DATA_ARCHIVE_SCHEMA_VERSION}`
        );
    }
    return bundle;
}

function refreshRegisteredStores() {
    for (const config of storageRegistry.getAll()) {
        config.rehydrate?.();
    }
}

async function restoreBundle(bundle: DataArchiveBundle): Promise<void> {
    const normalized = normalizeBundle(bundle);
    const localStorageKeysToClear = new Set([
        ...collectManagedLocalStorageKeys(),
        ...Object.keys(normalized.payload.localStorage),
        ...DEPRECATED_LOCAL_STORAGE_KEYS,
    ]);

    for (const key of localStorageKeysToClear) {
        localStorage.removeItem(key);
    }
    for (const [key, value] of Object.entries(normalized.payload.localStorage)) {
        if (DEPRECATED_LOCAL_STORAGE_KEYS.has(key)) continue;
        localStorage.setItem(key, value);
    }

    await clear();
    const idbPairs = Object.entries(normalized.payload.idbKeyval);
    if (idbPairs.length > 0) {
        await setMany(idbPairs);
    }

    await backgroundStorage.importAll(normalized.payload.backgroundStorage, { replace: true });
    refreshRegisteredStores();
}

async function createBundle(appVersion: string): Promise<DataArchiveBundle> {
    return {
        manifest: createManifest(appVersion),
        payload: await buildPayload(),
    };
}

export const FILE_EXTENSION = DATA_ARCHIVE_EXTENSION;

export const persistenceManager = {
    async inspectBackup(file: File): Promise<BackupInspectionResult> {
        return inspectArchive(file);
    },

    async exportData(appVersion: string): Promise<Blob> {
        const bundle = await createBundle(appVersion);
        return bundleToZip(bundle);
    },

    async importData(file: File): Promise<boolean> {
        const incomingBundle = await parseArchive(file);
        await restoreBundle(incomingBundle);
        return true;
    },

    downloadBackup(blob: Blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        const dateStr = new Date().toISOString().split("T")[0];
        a.href = url;
        a.download = `newtab-backup-${dateStr}${FILE_EXTENSION}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },
};

import { useEffect } from "react";
import { storageRegistry } from "./registry";

/**
 * Hook to synchronize state across multiple browser contexts (Popup/Tab).
 * Listens for localStorage 'storage' events and rehydrates the corresponding store.
 */
export function useStorageConnection() {
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (!e.key) return;

            const config = storageRegistry.get(e.key);
            if (config?.rehydrate) {
                config.rehydrate();
            }
        };

        window.addEventListener("storage", handleStorageChange);
        return () => window.removeEventListener("storage", handleStorageChange);
    }, []);
}

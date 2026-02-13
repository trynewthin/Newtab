import { useEffect } from 'react';
import { storageRegistry } from './registry';

// 纭繚 store/index 琚姞杞斤紝浠庤€岃Е鍙戞敞鍐岄€昏緫
// 铏界劧 App.tsx 鍙兘浼氶€氳繃鍏朵粬璺緞浣跨敤 store锛屼絾鏄惧紡瀵煎叆纭繚 side-effects 鎵ц
import '@/state';

/**
 * Hook to synchronize state across multiple browser contexts (Popup/Tab).
 * Listens for localStorage 'storage' events and rehydrates the corresponding store.
 * 
 * This hook is now fully generic. It queries the `storageRegistry` to find
 * the correct rehydrator function for any changed key.
 */
export function useStorageConnection() {
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (!e.key) return;

            // Generic lookup via registry
            // This decouples the sync logic from specific store implementations
            const config = storageRegistry.get(e.key);

            if (config && config.rehydrate) {
                // console.debug(`Syncing store for key: ${e.key}`);
                config.rehydrate();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);
}

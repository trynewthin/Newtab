import { useEffect } from 'react';
import { storageRegistry } from './registry';

// 确保 store/index 被加载，从而触发注册逻辑
// 虽然 App.tsx 可能会通过其他路径使用 store，但显式导入确保 side-effects 执行
import '@/store';

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

export * from './core/types';
export * from './core/storage';
export * from '@/features/launcher/store/ui';
export * from '@/features/settings/store';
export * from '@/features/pomodoro/store';
export * from '@/features/todo/store';
export * from '@/features/launcher/store/item';

import { useSettingsStore } from '@/features/settings/store';
import { usePomodoroStore } from '@/features/pomodoro/store';
import { useTodoStore } from '@/features/todo/store';
import { useItemStore } from '@/features/launcher/store/item';
import { storageRegistry } from './persistence/registry';

// ============================================================================
// Store Binding / Auto-Registration
// ============================================================================
// 杩欓噷鐨勪唬鐮佽礋璐ｅ皢 Store 鐨勫埛鏂拌兘鍔?(Rehydration) 缁戝畾鍒?unified registry銆?
// 杩欐牱鍋氱殑鐩殑鏄负浜嗚В鑰︼細
// - Modules 涓嶉渶瑕佺煡閬?Registry 鐨勫瓨鍦?
// - Sync/Backup 鍙渶瑕佸拰 Registry 浜や簰锛屼笉闇€瑕佸鍏ュ叿浣撶殑 Modules
// ============================================================================

storageRegistry.registerRehydrator('app-settings', () => useSettingsStore.persist.rehydrate());
storageRegistry.registerRehydrator('app-pomodoro', () => usePomodoroStore.persist.rehydrate());
storageRegistry.registerRehydrator('app-todos', () => useTodoStore.persist.rehydrate());
storageRegistry.registerRehydrator('app-items', () => useItemStore.persist.rehydrate());

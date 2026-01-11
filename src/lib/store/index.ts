import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { storageAdapter } from './adapter';
import { createConfigSlice } from './slices/configSlice';
import { createTagSlice } from './slices/tagSlice';
import { type AppState } from './types';

export const useAppStore = create<AppState>()(
    persist(
        (...a) => ({
            ...createConfigSlice(...a),
            ...createTagSlice(...a),
        }),
        {
            name: 'app-storage',
            storage: createJSONStorage(() => storageAdapter),
            partialize: (state) => {
                // 不持久化 isEditing 状态
                const { isEditing, ...rest } = state;
                return rest;
            },
        }
    )
);

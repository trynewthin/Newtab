import type { StateCreator } from 'zustand';
import { backgroundStorage } from '../backgroundStorage';
import { type AppState, type TagState } from '../types';

export const createTagSlice: StateCreator<AppState, [], [], TagState> = (set) => ({
    tags: [], // 初始标签列表为空

    addTag: (tag) => set((state) => ({
        tags: [...state.tags, { ...tag, id: crypto.randomUUID() }]
    })),
    updateTag: (id, updatedFields) => set((state) => ({
        tags: state.tags.map((t) => t.id === id ? { ...t, ...updatedFields } : t)
    })),
    removeTag: (id) => set((state) => {
        const target = state.tags.find((t) => t.id === id);
        if (target?.iconDataUrl?.startsWith('idb://')) {
            const key = target.iconDataUrl.replace('idb://', '');
            // 异步清理缓存图标，忽略错误
            backgroundStorage.deleteIcon(key).catch(console.error);
        }
        return {
            tags: state.tags.filter((t) => t.id !== id)
        };
    }),
    setTags: (tags) => set({ tags }),
});

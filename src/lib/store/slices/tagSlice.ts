import type { StateCreator } from 'zustand';
import { type AppState, type TagState } from '../types';

export const createTagSlice: StateCreator<AppState, [], [], TagState> = (set) => ({
    tags: [], // 初始标签列表为空

    addTag: (tag) => set((state) => ({
        tags: [...state.tags, { ...tag, id: crypto.randomUUID() }]
    })),
    updateTag: (id, updatedFields) => set((state) => ({
        tags: state.tags.map((t) => t.id === id ? { ...t, ...updatedFields } : t)
    })),
    removeTag: (id) => set((state) => ({
        tags: state.tags.filter((t) => t.id !== id)
    })),
    setTags: (tags) => set({ tags }),
});

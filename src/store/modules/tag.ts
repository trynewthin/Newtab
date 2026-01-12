import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createPersistConfig } from '../core/storage';
import { type Tag } from '../core/types';
import { backgroundStorage } from '../core/backgroundStorage';

interface TagState {
    tags: Tag[];

    addTag: (tag: Omit<Tag, 'id'>) => void;
    updateTag: (id: string, tag: Partial<Omit<Tag, 'id'>>) => void;
    removeTag: (id: string) => void;
    setTags: (tags: Tag[]) => void;
}

export const useTagStore = create<TagState>()(
    persist(
        (set) => ({
            tags: [],

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
        }),
        createPersistConfig('app-tags')
    )
);

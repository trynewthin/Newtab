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
    batchRemoveTags: (ids: string[]) => void;
    setTags: (tags: Tag[]) => void;
    batchGroupTags: (ids: string[]) => void;
    ungroupFolder: (id: string) => void;
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
                const findAndCleanupIcon = (items: Tag[]) => {
                    for (const item of items) {
                        if (item.id === id) {
                            if (item.iconDataUrl?.startsWith('idb://')) {
                                const key = item.iconDataUrl.replace('idb://', '');
                                backgroundStorage.deleteIcon(key).catch(console.error);
                            }
                            return true;
                        }
                        if (item.isFolder && item.children && findAndCleanupIcon(item.children)) {
                            return true;
                        }
                    }
                    return false;
                };

                findAndCleanupIcon(state.tags);

                const recursiveRemove = (items: Tag[]): Tag[] => {
                    const filtered = items.filter((t) => t.id !== id);

                    const processed = filtered.map((t) => {
                        if (t.isFolder && t.children) {
                            return { ...t, children: recursiveRemove(t.children) };
                        }
                        return t;
                    });

                    const finalItems: Tag[] = [];
                    for (const item of processed) {
                        if (item.isFolder && item.children && item.children.length < 2) {
                            finalItems.push(...item.children);
                        } else {
                            finalItems.push(item);
                        }
                    }
                    return finalItems;
                };

                return { tags: recursiveRemove(state.tags) };
            }),

            batchRemoveTags: (ids) => set((state) => {
                const cleanupIcons = (items: Tag[]) => {
                    items.forEach(item => {
                        if (ids.includes(item.id)) {
                            if (item.iconDataUrl?.startsWith('idb://')) {
                                const key = item.iconDataUrl.replace('idb://', '');
                                backgroundStorage.deleteIcon(key).catch(console.error);
                            }
                        }
                        if (item.isFolder && item.children) {
                            cleanupIcons(item.children);
                        }
                    });
                };

                cleanupIcons(state.tags);

                const recursiveRemove = (items: Tag[]): Tag[] => {
                    const filtered = items.filter((t) => !ids.includes(t.id));

                    const processed = filtered.map((t) => {
                        if (t.isFolder && t.children) {
                            return { ...t, children: recursiveRemove(t.children) };
                        }
                        return t;
                    });

                    const finalItems: Tag[] = [];
                    for (const item of processed) {
                        if (item.isFolder && item.children && item.children.length < 2) {
                            finalItems.push(...item.children);
                        } else {
                            finalItems.push(item);
                        }
                    }
                    return finalItems;
                };

                return { tags: recursiveRemove(state.tags) };
            }),

            setTags: (tags) => set({ tags }),

            batchGroupTags: (ids) => set((state) => {
                if (ids.length <= 1) return state;

                const selectedItems = state.tags.filter(t => ids.includes(t.id));
                const firstSelectedIndex = state.tags.findIndex(t => ids.includes(t.id));

                if (firstSelectedIndex === -1) return state;

                const selectedFolders = selectedItems.filter(t => t.isFolder);
                const selectedLeafTags = selectedItems.filter(t => !t.isFolder);

                let targetFolder: Tag;
                let otherSelectedFolders: Tag[] = [];

                if (selectedFolders.length > 0) {
                    targetFolder = { ...selectedFolders[0] };
                    otherSelectedFolders = selectedFolders.slice(1);
                } else {
                    targetFolder = {
                        id: `folder_${Date.now()}`,
                        title: 'New Folder',
                        url: '#',
                        isFolder: true,
                        type: 'folder',
                        children: []
                    };
                }

                const newChildren = [...(targetFolder.children || [])];
                newChildren.push(...selectedLeafTags);

                otherSelectedFolders.forEach(folder => {
                    if (folder.children) {
                        newChildren.push(...folder.children);
                    }
                });

                targetFolder.children = newChildren;

                const newTags = state.tags.filter(t => !ids.includes(t.id));
                newTags.splice(firstSelectedIndex, 0, targetFolder);

                return { tags: newTags };
            }),

            ungroupFolder: (id) => set((state) => {
                const folderIndex = state.tags.findIndex(t => t.id === id);
                const folder = state.tags[folderIndex];

                if (!folder || !folder.isFolder || !folder.children) return state;

                const newTags = [...state.tags];
                newTags.splice(folderIndex, 1, ...folder.children);

                return { tags: newTags };
            }),
        }),
        createPersistConfig('app-tags')
    )
);

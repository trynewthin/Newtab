import { create } from 'zustand';

interface UIState {
    // 界面交互状态
    isEditing: boolean;
    selectedTagIds: string[];

    setEditing: (status: boolean) => void;
    toggleEditing: () => void;

    // 选中态管理
    toggleTagSelection: (id: string) => void;
    clearSelection: () => void;
}

export const useUIStore = create<UIState>((set) => ({
    isEditing: false,
    selectedTagIds: [],

    setEditing: (status) => set({
        isEditing: status,
        // 关闭编辑模式时自动清空选中
        selectedTagIds: status ? [] : []
    }),

    toggleEditing: () => set((state) => ({
        isEditing: !state.isEditing,
        selectedTagIds: [] // 切换模式时清空
    })),

    toggleTagSelection: (id) => set((state) => ({
        selectedTagIds: state.selectedTagIds.includes(id)
            ? state.selectedTagIds.filter(tid => tid !== id)
            : [...state.selectedTagIds, id]
    })),

    clearSelection: () => set({ selectedTagIds: [] }),
}));

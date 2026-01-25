import { create } from 'zustand';
import type { SystemType } from '@/features/launcher/system/systemRegistry';

export type SystemDialogType = SystemType;

interface UIState {
    // 界面交互状态
    isEditing: boolean;
    selectedTagIds: string[];
    activeSystemDialog: SystemDialogType | null;

    setEditing: (status: boolean) => void;
    toggleEditing: () => void;

    // 选中态管理
    toggleTagSelection: (id: string) => void;
    clearSelection: () => void;

    // 弹窗管理
    setActiveSystemDialog: (type: SystemDialogType | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
    isEditing: false,
    selectedTagIds: [],
    activeSystemDialog: null,

    setEditing: (status) => set({
        isEditing: status,
        selectedTagIds: []
    }),

    toggleEditing: () => set((state) => ({
        isEditing: !state.isEditing,
        selectedTagIds: []
    })),

    toggleTagSelection: (id) => set((state) => ({
        selectedTagIds: state.selectedTagIds.includes(id)
            ? state.selectedTagIds.filter(tid => tid !== id)
            : [...state.selectedTagIds, id]
    })),

    clearSelection: () => set({ selectedTagIds: [] }),

    setActiveSystemDialog: (type) => set({ activeSystemDialog: type }),
}));

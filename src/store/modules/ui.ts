import { create } from 'zustand';

interface UIState {
    // 界面交互状态
    isEditing: boolean;
    setEditing: (status: boolean) => void;
    toggleEditing: () => void;

    // 可以在此添加更多 UI 状态，如 Sidebar显隐、当前激活的 Modal 等
}

export const useUIStore = create<UIState>((set) => ({
    isEditing: false,
    setEditing: (status) => set({ isEditing: status }),
    toggleEditing: () => set((state) => ({ isEditing: !state.isEditing })),
}));

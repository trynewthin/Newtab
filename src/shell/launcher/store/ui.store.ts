import { create } from "zustand";
import type { SystemType } from "@/shell/launcher/registry/systemRegistry";

export type SystemDialogType = SystemType;

export interface UIState {
    isEditing: boolean;
    selectedTagIds: string[];
    activeSystemDialog: SystemDialogType | null;
    isFolderPreviewVisible: boolean;
    setEditing: (status: boolean) => void;
    toggleEditing: () => void;
    toggleTagSelection: (id: string) => void;
    clearSelection: () => void;
    setActiveSystemDialog: (type: SystemDialogType | null) => void;
    setFolderPreviewVisible: (visible: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
    isEditing: false,
    selectedTagIds: [],
    activeSystemDialog: null,
    isFolderPreviewVisible: false,

    setEditing: (status) =>
        set({
            isEditing: status,
            selectedTagIds: [],
        }),

    toggleEditing: () =>
        set((state) => ({
            isEditing: !state.isEditing,
            selectedTagIds: [],
        })),

    toggleTagSelection: (id) =>
        set((state) => ({
            selectedTagIds: state.selectedTagIds.includes(id)
                ? state.selectedTagIds.filter((tagId) => tagId !== id)
                : [...state.selectedTagIds, id],
        })),

    clearSelection: () => set({ selectedTagIds: [] }),
    setActiveSystemDialog: (type) => set({ activeSystemDialog: type }),
    setFolderPreviewVisible: (visible) => set({ isFolderPreviewVisible: visible }),
}));

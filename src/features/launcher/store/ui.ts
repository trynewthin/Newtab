import { create } from 'zustand';
import type { SystemType } from '@/features/launcher/system/systemRegistry';
import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

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

/**
 * Hook to sync activeSystemDialog with URL hash
 * Usage: Call this in your main component (e.g., DashboardView)
 */
export function useSystemDialogRouter() {
    const navigate = useNavigate();
    const location = useLocation();
    const { activeSystemDialog, setActiveSystemDialog } = useUIStore();
    const isUpdatingFromUrl = useRef(false);
    const isUpdatingFromState = useRef(false);

    // Sync URL to state (on mount and hash change)
    useEffect(() => {
        if (isUpdatingFromState.current) {
            isUpdatingFromState.current = false;
            return;
        }

        const hash = location.hash.slice(1); // Remove '#'
        const validTypes: SystemType[] = ['settings', 'theme', 'add', 'icon-manager', 'pomodoro', 'todo', 'ai', 'downloads', 'bookmarks', 'history'];

        isUpdatingFromUrl.current = true;

        if (hash && validTypes.includes(hash as SystemType)) {
            if (activeSystemDialog !== hash) {
                setActiveSystemDialog(hash as SystemType);
            }
        } else if (hash === '' && activeSystemDialog !== null) {
            setActiveSystemDialog(null);
        }

        setTimeout(() => {
            isUpdatingFromUrl.current = false;
        }, 0);
    }, [location.hash]);

    // Sync state to URL
    useEffect(() => {
        if (isUpdatingFromUrl.current) {
            return;
        }

        const currentHash = location.hash.slice(1);

        isUpdatingFromState.current = true;

        if (activeSystemDialog && currentHash !== activeSystemDialog) {
            navigate(`#${activeSystemDialog}`, { replace: false });
        } else if (!activeSystemDialog && currentHash && currentHash !== '') {
            navigate('#', { replace: false });
        }

        setTimeout(() => {
            isUpdatingFromState.current = false;
        }, 0);
    }, [activeSystemDialog]);
}

import { create } from 'zustand';

/**
 * 视觉分析细分状态
 */
export type VisionStatus = 'idle' | 'capturing' | 'analyzing' | 'success' | 'error';

interface VisionState {
    status: VisionStatus;
    lastError: string | null;
    setStatus: (status: VisionStatus) => void;
    setError: (error: string | null) => void;
}

/**
 * 视觉模块内部 Hook - 供 UI 订阅进度
 */
export const useVisionState = create<VisionState>((set, get) => ({
    status: 'idle',
    lastError: null,
    setStatus: (status) => set({
        status,
        lastError: status === 'error' ? get().lastError : null
    }),
    setError: (lastError) => set({ status: 'error', lastError }),
}));

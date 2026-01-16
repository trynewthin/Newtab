import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval';
import type { Message, ModelConfig } from './types';
import { getTextContent } from './types';

interface SessionMetadata {
    id: string;
    title: string;
    updatedAt: number;
    preview?: string;
}

interface AiState {
    models: ModelConfig[];
    activeModelId: string | null;
    activeVisionModelId: string | null;

    sessions: SessionMetadata[];
    currentSessionId: string | null;

    messages: Message[];
    isLoading: boolean;
    isRestoring: boolean;

    createSession: () => Promise<void>;
    deleteSession: (id: string) => Promise<void>;
    switchSession: (id: string) => Promise<void>;
    updateSessionTitle: (id: string, title: string) => void;

    addModel: (model: Omit<ModelConfig, 'id'>) => void;
    updateModel: (id: string, updates: Partial<ModelConfig>) => void;
    deleteModel: (id: string) => void;
    setActiveModel: (id: string) => void;
    setActiveVisionModel: (id: string | null) => void;

    addMessage: (message: Partial<Message> & { role: Message['role'] }) => Promise<string>;
    updateMessage: (id: string, updates: Partial<Message>) => Promise<void>;
    clearMessages: () => Promise<void>;
    setLoading: (loading: boolean) => void;
    getActiveModelConfig: () => ModelConfig | undefined;
    getActiveVisionModelConfig: () => ModelConfig | undefined;

    getDynamicSystemPrompt: (config: ModelConfig) => string;

    hydrateSession: () => Promise<void>;
}

const BASE_AGENT_PROMPT = `你是一个强大的 Web 助手。请根据用户的需求，选择合适的工具来完成任务。`;

const VISION_TOOL_PROMPT = `
## 视觉代理功能 (VISION ENABLED):
你拥有“视觉双眼”，可以查看并操作网页：
1. 首先调用 \`get_semantic_map\` 来获取当前页面的实体与 ID 映射。
2. 根据返回的实体信息（如视频卡片、按钮），使用 \`click_by_id\` 进行精准操作。
3. 如果需要翻页或查看更多内容，使用 \`scroll\` 工具。
4. 如果页面发生滚动或内容变化，请务必重新调用 \`get_semantic_map\` 以更新你的视觉感知。
`;

const DEFAULT_MODEL: ModelConfig = {
    id: 'default',
    name: 'Vision Agent Model',
    apiKey: '',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
    systemPrompt: '请以专业友好的中文回答。',
    temperature: 0.1,
    visionEnabled: true, // 默认开启视觉包
    enabledTools: ['get_semantic_map', 'click_by_id', 'scroll']
};

export const useAiStore = create<AiState>()(
    persist(
        (set, get) => ({
            models: [DEFAULT_MODEL],
            activeModelId: 'default',
            activeVisionModelId: 'default',
            sessions: [],
            currentSessionId: null,
            messages: [],
            isLoading: false,
            isRestoring: false,

            getDynamicSystemPrompt: (config: ModelConfig) => {
                let prompt = BASE_AGENT_PROMPT;

                // 🔥 只有总开关开启时，才注入任何视觉指令
                if (config.visionEnabled) {
                    const enabledTools = config.enabledTools || [];
                    const hasVision = enabledTools.some(t =>
                        ['get_semantic_map', 'click_by_id', 'scroll'].includes(t)
                    );
                    if (hasVision) prompt += VISION_TOOL_PROMPT;
                }

                if (config.systemPrompt) {
                    prompt += `\n## 用户追加指令:\n${config.systemPrompt}`;
                }

                return prompt;
            },

            addModel: (modelData) => set((state) => {
                const newModel = {
                    ...modelData,
                    id: uuidv4(),
                    visionEnabled: modelData.visionEnabled ?? true,
                    enabledTools: modelData.enabledTools || []
                };
                return {
                    models: [...state.models, newModel],
                    activeModelId: state.models.length === 0 ? newModel.id : state.activeModelId,
                    activeVisionModelId: state.models.length === 0 ? newModel.id : state.activeVisionModelId
                };
            }),

            updateModel: (id, updates) => set((state) => ({
                models: state.models.map(m => m.id === id ? { ...m, ...updates } : m)
            })),

            deleteModel: (id) => set((state) => {
                const newModels = state.models.filter(m => m.id !== id);
                let newActiveId = state.activeModelId;
                let newVisionId = state.activeVisionModelId;
                if (state.activeModelId === id) newActiveId = newModels.length > 0 ? newModels[0].id : null;
                if (state.activeVisionModelId === id) newVisionId = newModels.length > 0 ? newModels[0].id : null;
                return { models: newModels, activeModelId: newActiveId, activeVisionModelId: newVisionId };
            }),

            setActiveModel: (id) => set({ activeModelId: id }),
            setActiveVisionModel: (id) => set({ activeVisionModelId: id }),

            getActiveModelConfig: () => {
                const state = get();
                return state.models.find(m => m.id === state.activeModelId);
            },

            getActiveVisionModelConfig: () => {
                const state = get();
                const visionId = state.activeVisionModelId || state.activeModelId;
                return state.models.find(m => m.id === visionId);
            },

            hydrateSession: async () => {
                const state = get();
                if (state.sessions.length === 0) await get().createSession();
                else if (state.currentSessionId) await get().switchSession(state.currentSessionId);
                else await get().switchSession(state.sessions[0].id);
            },

            createSession: async () => {
                const newId = uuidv4();
                const newSession: SessionMetadata = { id: newId, title: 'New Chat', updatedAt: Date.now(), preview: 'Start a new conversation...' };
                set(state => ({ sessions: [newSession, ...state.sessions], currentSessionId: newId, messages: [] }));
                await idbSet(newId, []);
            },

            deleteSession: async (id) => {
                try { await idbDel(id); } catch (e) { }
                set(state => {
                    const newSessions = state.sessions.filter(s => s.id !== id);
                    if (state.currentSessionId === id) return { sessions: newSessions, currentSessionId: null, messages: [] };
                    return { sessions: newSessions };
                });
                const state = get();
                if (!state.currentSessionId && state.sessions.length > 0) await get().switchSession(state.sessions[0].id);
                else if (state.sessions.length === 0) await get().createSession();
            },

            switchSession: async (id) => {
                const state = get();
                if (state.currentSessionId === id && state.messages.length > 0) return;
                set({ isRestoring: true, currentSessionId: id, messages: [] });
                try {
                    const messages = await idbGet<Message[]>(id) || [];
                    set({ messages, isRestoring: false });
                } catch (e) { set({ messages: [], isRestoring: false }); }
            },

            updateSessionTitle: (id, title) => set((state) => ({
                sessions: state.sessions.map(s => s.id === id ? { ...s, title } : s)
            })),

            addMessage: async (msg) => {
                const msgId = msg.id || uuidv4();
                const newMessage: Message = { id: msgId, content: msg.content || '', timestamp: Date.now(), ...msg } as Message;
                set(state => ({ messages: [...state.messages, newMessage] }));
                const state = get();
                const sessionId = state.currentSessionId;
                if (!sessionId) return msgId;
                try { await idbSet(sessionId, [...state.messages]); } catch (e) { }
                set(s => {
                    let newTitle = undefined;
                    const session = s.sessions.find(xyz => xyz.id === sessionId);
                    if (session && (session.title === 'New Chat') && msg.role === 'user') {
                        const text = typeof msg.content === 'string' ? msg.content : getTextContent(msg.content);
                        if (text) newTitle = text.slice(0, 30);
                    }
                    return {
                        sessions: s.sessions.map(sess => sess.id === sessionId ? {
                            ...sess,
                            updatedAt: Date.now(),
                            preview: typeof msg.content === 'string' ? msg.content.slice(0, 50) : '[Multimodal]',
                            title: newTitle || sess.title
                        } : sess)
                    };
                });
                return msgId;
            },

            updateMessage: async (id, updates) => {
                set(state => ({ messages: state.messages.map(m => m.id === id ? { ...m, ...updates } : m) }));
                const state = get();
                if (state.currentSessionId) await idbSet(state.currentSessionId, state.messages);
            },

            clearMessages: async () => {
                set({ messages: [] });
                const state = get();
                if (state.currentSessionId) await idbSet(state.currentSessionId, []);
            },

            setLoading: (isLoading) => set({ isLoading }),
        }),
        {
            name: 'app-ai-meta-storage',
            partialize: (state) => ({
                models: state.models,
                activeModelId: state.activeModelId,
                activeVisionModelId: state.activeVisionModelId,
                sessions: state.sessions,
                currentSessionId: state.currentSessionId
            }),
        }
    )
);

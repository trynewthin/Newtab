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
    activeSearchModelId: string | null;
    enabledSearchProviders: string[];

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
    setActiveSearchModel: (id: string | null) => void;
    setEnabledSearchProviders: (providers: string[]) => void;

    addMessage: (message: Partial<Message> & { role: Message['role'] }) => Promise<string>;
    updateMessage: (id: string, updates: Partial<Message>) => Promise<void>;
    clearMessages: () => Promise<void>;
    setLoading: (loading: boolean) => void;
    getActiveModelConfig: () => ModelConfig | undefined;
    getActiveVisionModelConfig: () => ModelConfig | undefined;
    getActiveSearchModelConfig: () => ModelConfig | undefined;

    getDynamicSystemPrompt: (config: ModelConfig) => string;

    hydrateSession: () => Promise<void>;
}

const BASE_AGENT_PROMPT = `你是一个强大的 Web 助手。请根据用户的需求，选择合适的工具来完成任务。
## 开始前判断（必须遵循，内部完成）
1. 明确用户目标与所需操作。
2. 判断当前页面是否匹配任务。
3. 判断能否在当前页面完成；若不能，再进行澄清或导航建议。

## 任务流程（必须遵循，输出需自然简洁）
1. 目标含糊时先澄清。
2. 简短计划后执行。
3. 关键动作后校验页面状态。
4. 完成后简要总结。

## 工具调用原则
- 默认先读取页面结构（get_accessibility_tree），除非用户明确要求直接导航。
- 只有在页面内无法完成目标时，才使用 search_web。
- 执行关键操作前先确认目标元素存在（如消息输入框/发送按钮）。
`;

const WEB_AGENT_TOOL_PROMPT = `
## 网页操作能力 (WEB AGENT ENABLED):
你可以查看并操作当前浏览器标签页，遵循以下策略：

### 感知策略 (Text-First, Vision-Fallback):
1. **首选**: 调用 \`get_accessibility_tree\` 获取当前视口的文本语义树。
2. **备选**: 仅当文本树不足以理解页面（如纯图标按钮、图表）时，才调用 \`capture_screenshot\`。

### 导航与搜索:
1. 使用 \`navigate_to\` 直接跳转到已知 URL。
2. 使用 \`search_web\` 利用预设的搜索引擎查找信息。

### 操作规则:
1. 使用 \`click_by_id\` 点击元素，ID 来自语义树。
2. 使用 \`type_text\` 向输入框输入文字。
3. 使用 \`scroll\` 滚动页面查看更多内容。
4. **重要**: 每次跳转或操作后，你必须再次调用 \`get_accessibility_tree\` 来刷新你的感知。
5. **表达风格**: 对外输出保持自然简洁，不要机械列点；仅在必要时简短说明动作。
`;

const DEFAULT_MODEL: ModelConfig = {
    id: 'default',
    name: 'Web Agent Model',
    apiKey: '',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
    systemPrompt: '请以专业友好的中文回答。',
    temperature: 0.1,
    visionEnabled: true,
    searchEngine: 'https://www.google.com/search?q=%s',
    enabledTools: ['navigate_to', 'search_web', 'get_accessibility_tree', 'click_by_id', 'type_text', 'scroll', 'capture_screenshot']
};

export const useAiStore = create<AiState>()(
    persist(
        (set, get) => ({
            models: [DEFAULT_MODEL],
            activeModelId: 'default',
            activeVisionModelId: 'default',
            activeSearchModelId: 'default',
            enabledSearchProviders: ['google', 'bing', 'duckduckgo'],
            sessions: [],
            currentSessionId: null,
            messages: [],
            isLoading: false,
            isRestoring: false,

            getDynamicSystemPrompt: (config: ModelConfig) => {
                let prompt = BASE_AGENT_PROMPT;
                if (config.visionEnabled) {
                    const enabledTools = config.enabledTools || [];
                    const hasWebAgent = enabledTools.some(t =>
                        ['get_accessibility_tree', 'click_by_id', 'scroll', 'type_text', 'capture_screenshot', 'navigate_to', 'search_web'].includes(t)
                    );
                    if (hasWebAgent) prompt += WEB_AGENT_TOOL_PROMPT;
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
                    activeVisionModelId: state.models.length === 0 ? newModel.id : state.activeVisionModelId,
                    activeSearchModelId: state.models.length === 0 ? newModel.id : state.activeSearchModelId
                };
            }),

            updateModel: (id, updates) => set((state) => ({
                models: state.models.map(m => m.id === id ? { ...m, ...updates } : m)
            })),

            deleteModel: (id) => set((state) => {
                const newModels = state.models.filter(m => m.id !== id);
                let newActiveId = state.activeModelId;
                let newVisionId = state.activeVisionModelId;
                let newSearchId = state.activeSearchModelId;
                if (state.activeModelId === id) newActiveId = newModels.length > 0 ? newModels[0].id : null;
                if (state.activeVisionModelId === id) newVisionId = newModels.length > 0 ? newModels[0].id : null;
                if (state.activeSearchModelId === id) newSearchId = newModels.length > 0 ? newModels[0].id : null;
                return { models: newModels, activeModelId: newActiveId, activeVisionModelId: newVisionId, activeSearchModelId: newSearchId };
            }),

            setActiveModel: (id) => set({ activeModelId: id }),
            setActiveVisionModel: (id) => set({ activeVisionModelId: id }),
            setActiveSearchModel: (id) => set({ activeSearchModelId: id }),
            setEnabledSearchProviders: (providers) => set({ enabledSearchProviders: providers }),

            getActiveModelConfig: () => {
                const state = get();
                return state.models.find(m => m.id === state.activeModelId);
            },

            getActiveVisionModelConfig: () => {
                const state = get();
                const visionId = state.activeVisionModelId || state.activeModelId;
                return state.models.find(m => m.id === visionId);
            },

            getActiveSearchModelConfig: () => {
                const state = get();
                const searchId = state.activeSearchModelId || state.activeModelId;
                return state.models.find(m => m.id === searchId);
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
                activeSearchModelId: state.activeSearchModelId,
                enabledSearchProviders: state.enabledSearchProviders,
                sessions: state.sessions,
                currentSessionId: state.currentSessionId
            }),
        }
    )
);

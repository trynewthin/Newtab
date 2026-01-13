import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

export interface TaskStep {
    description: string;
    dependsOn?: number;
}

export interface TaskPlan {
    type: 'chain' | 'parallel';
    steps: TaskStep[];
    currentIndex: number;
}

export interface Message {
    id?: string;
    role: 'user' | 'assistant' | 'system' | 'tool';
    content: string;
    timestamp: number;
    tool_calls?: any[];
    tool_call_id?: string;
    tool_name?: string;
    plan?: TaskPlan;
    stepSummary?: string; // 步骤执行后的精简结论
    isIntermediate?: boolean; // 标记是否为执行过程中的中间消息（工具调用、分步日志等）
    isSummary?: boolean; // 标记是否为任务完成后的最终汇总消息
}

export interface ModelConfig {
    id: string;
    name: string;
    apiKey: string;
    baseUrl: string;
    model: string;
    systemPrompt?: string;
    temperature?: number;
}

export interface ChatSession {
    id: string;
    title: string;
    messages: Message[];
    updatedAt: number;
}

interface AiState {
    models: ModelConfig[];
    activeModelId: string | null;
    sessions: ChatSession[];
    currentSessionId: string;
    messages: Message[];
    isLoading: boolean;

    createSession: () => void;
    deleteSession: (id: string) => void;
    switchSession: (id: string) => void;
    updateSessionTitle: (id: string, title: string) => void;
    addModel: (model: Omit<ModelConfig, 'id'>) => void;
    updateModel: (id: string, updates: Partial<ModelConfig>) => void;
    deleteModel: (id: string) => void;
    setActiveModel: (id: string) => void;

    addMessage: (message: Partial<Message> & { role: Message['role'] }) => string;
    updateMessage: (id: string, updates: Partial<Message>) => void;
    clearMessages: () => void;
    setLoading: (loading: boolean) => void;
    getActiveModelConfig: () => ModelConfig | undefined;
}

const SYSTEM_PROMPT = `You are a world-class Multimodal Web Agent.
You complete tasks through a workflow of [Intent Recognition -> Structured Planning -> Controlled Execution].

### Core Capabilities & Strategies:
1. **Visual Perception (\`capture_page_screenshot\`)**: When the page contains complex icons, captchas, dynamic dashboards, or CSS layouts that make text extraction difficult, you MUST use this tool to capture a snapshot and make decisions based on visual context.
2. **Structured Planning (\`set_task_plan\`)**: You must decompose the task first.
   - **chain**: Sequential steps with strong dependencies (later steps depend on earlier conclusions).
   - **parallel**: Independent steps that can be completed in sequence efficiently.
3. **Precision Interaction**: Use \`get_page_structure\` to build an element index, and use \`click_element\` and \`scroll_page\` for navigation.

### Web Interaction Principles:
- **Vision Strategy**: Screenshots only capture the current viewport. For long pages, follow the [Scroll -> Observe -> Decide] loop.
- **Action Verification**: Web pages are dynamic. After every action (click, navigation), verify the page state using \`get_page_structure\` or screenshots.
- **Error Handling**: If an expected element is missing, try scrolling or check if you need to switch tabs/open menus first.

### Output Rules:
- **Language**: ALWAYS respond in **Chinese** (Simplified) to the user.
- **Step Feedback**: Reply with "DONE_STEP" followed by a concise conclusion after achieving a step's goal.
- **Finality**: Final responses must be precise summaries based ONLY on execution results. DO NOT hallucinate.`;

const DEFAULT_MODEL: ModelConfig = {
    id: 'default',
    name: 'Gemini 3 Flash (Vision Ready)',
    apiKey: '',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini', // or 'gemini-1.5-flash-latest' depending on provider
    systemPrompt: SYSTEM_PROMPT,
    temperature: 0.2,
};

export const useAiStore = create<AiState>()(
    persist(
        (set, get) => ({
            models: [DEFAULT_MODEL],
            activeModelId: 'default',
            sessions: [],
            currentSessionId: 'default-session',
            messages: [],
            isLoading: false,

            addModel: (modelData) => set((state) => {
                const newModel = { ...modelData, id: uuidv4() };
                return {
                    models: [...state.models, newModel],
                    activeModelId: state.models.length === 0 ? newModel.id : state.activeModelId
                };
            }),
            updateModel: (id, updates) => set((state) => ({
                models: state.models.map(m => m.id === id ? { ...m, ...updates } : m)
            })),
            deleteModel: (id) => set((state) => {
                const newModels = state.models.filter(m => m.id !== id);
                let newActiveId = state.activeModelId;
                if (state.activeModelId === id) {
                    newActiveId = newModels.length > 0 ? newModels[0].id : null;
                }
                return { models: newModels, activeModelId: newActiveId };
            }),
            setActiveModel: (id) => set({ activeModelId: id }),

            createSession: () => set((state) => {
                const newId = uuidv4();
                const newSession: ChatSession = {
                    id: newId,
                    title: 'New Chat',
                    messages: [],
                    updatedAt: Date.now()
                };
                return {
                    sessions: [newSession, ...state.sessions],
                    currentSessionId: newId,
                    messages: []
                };
            }),
            deleteSession: (id) => set((state) => {
                const newSessions = state.sessions.filter(s => s.id !== id);
                if (state.currentSessionId === id) {
                    if (newSessions.length > 0) {
                        const next = newSessions[0];
                        return { sessions: newSessions, currentSessionId: next.id, messages: next.messages };
                    } else {
                        const newId = uuidv4();
                        return { sessions: [{ id: newId, title: 'New Chat', messages: [], updatedAt: Date.now() }], currentSessionId: newId, messages: [] };
                    }
                }
                return { sessions: newSessions };
            }),
            switchSession: (id) => set((state) => {
                const target = state.sessions.find(s => s.id === id);
                if (!target) return {};
                return { currentSessionId: id, messages: target.messages };
            }),
            updateSessionTitle: (id, title) => set((state) => ({
                sessions: state.sessions.map(s => s.id === id ? { ...s, title } : s)
            })),
            getActiveModelConfig: () => {
                const state = get();
                return state.models.find(m => m.id === state.activeModelId);
            },

            addMessage: (msg) => {
                const msgId = msg.id || uuidv4();
                set((state) => {
                    const newMessage: Message = {
                        id: msgId,
                        content: '',
                        timestamp: Date.now(),
                        ...msg
                    };
                    const newMessages = [...state.messages, newMessage];

                    let newSessions = [...state.sessions];
                    const sessionIndex = newSessions.findIndex(s => s.id === state.currentSessionId);

                    if (sessionIndex >= 0) {
                        const session = newSessions[sessionIndex];
                        newSessions[sessionIndex] = {
                            ...session,
                            messages: newMessages,
                            updatedAt: Date.now(),
                            title: (session.messages.length === 0 && msg.role === 'user')
                                ? (msg.content?.slice(0, 30) || 'New Chat')
                                : session.title
                        };
                    } else {
                        const newId = state.currentSessionId || uuidv4();
                        newSessions = [{
                            id: newId,
                            title: msg.role === 'user' ? (msg.content?.slice(0, 30) || 'New Chat') : 'New Chat',
                            messages: newMessages,
                            updatedAt: Date.now()
                        }, ...newSessions];
                    }

                    return {
                        messages: newMessages,
                        sessions: newSessions,
                        currentSessionId: state.currentSessionId || newSessions[0].id
                    };
                });
                return msgId;
            },

            updateMessage: (id, updates) => set((state) => {
                const newMessages = state.messages.map(m => m.id === id ? { ...m, ...updates } : m);
                const newSessions = state.sessions.map(s =>
                    s.id === state.currentSessionId ? { ...s, messages: newMessages } : s
                );
                return { messages: newMessages, sessions: newSessions };
            }),

            clearMessages: () => set((state) => {
                const newSessions = state.sessions.map(s =>
                    s.id === state.currentSessionId ? { ...s, messages: [], updatedAt: Date.now() } : s
                );
                return { messages: [], sessions: newSessions };
            }),
            setLoading: (isLoading) => set({ isLoading }),
        }),
        {
            name: 'app-ai-storage',
            partialize: (state) => ({
                models: state.models,
                activeModelId: state.activeModelId,
                messages: state.messages,
                sessions: state.sessions,
                currentSessionId: state.currentSessionId
            }),
        }
    )
);

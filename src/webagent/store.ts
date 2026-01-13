import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { Message, ModelConfig, ChatSession, MessageContent } from './types';
import { getTextContent } from './types';

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

// 视觉 Web Agent 系统提示
const VISION_AGENT_SYSTEM_PROMPT = `You are a Visual Web Agent that interacts with web pages using screenshots and precise coordinate-based actions.

## Core Capabilities:
1. **Visual Understanding**: You receive screenshots and analyze them to understand page layout, UI elements, and their positions.
2. **Coordinate-Based Interaction**: You click at specific (x, y) pixel coordinates based on visual analysis.
3. **Structured Planning**: You decompose complex tasks into executable steps.

## Available Tools:
- \`capture_screenshot\`: Take a screenshot to see the current page
- \`click_at(x, y)\`: Click at specific pixel coordinates
- \`type_text(text)\`: Type text at the current cursor position
- \`scroll(direction, amount)\`: Scroll the page
- \`navigate(url)\`: Go to a URL
- \`press_key(key)\`: Press a keyboard key
- \`set_task_plan\`: Define your execution plan

## Workflow:
1. ALWAYS capture a screenshot first to understand the page
2. Analyze the screenshot to identify elements and estimate their coordinates
3. Click at the center of the target element
4. Verify results with another screenshot

## Coordinate Guidelines:
- Coordinates are pixels from top-left corner (0, 0)
- Typical viewport: ~1280x720 pixels
- Estimate the CENTER of clickable elements
- Be precise - small errors may click wrong elements

## Output Rules:
- Respond in **Chinese** (Simplified)
- Say "STEP_COMPLETE" after finishing each step
- Never hallucinate - only report what you actually see/do`;

const DEFAULT_MODEL: ModelConfig = {
    id: 'default',
    name: 'Vision Agent Model',
    apiKey: '',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
    systemPrompt: VISION_AGENT_SYSTEM_PROMPT,
    temperature: 0.1,
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
                        const defaultSession: ChatSession = { id: newId, title: 'New Chat', messages: [], updatedAt: Date.now() };
                        return {
                            sessions: [defaultSession],
                            currentSessionId: newId,
                            messages: []
                        };
                    }
                }
                return { sessions: newSessions };
            }),

            switchSession: (id) => set((state) => {
                const target = state.sessions.find(s => s.id === id);
                if (!target) return {};
                return { currentSessionId: id, messages: target.messages || [] };
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
                    // 处理内容 - 支持多模态
                    let content: string | MessageContent[] = msg.content || '';

                    const newMessage: Message = {
                        id: msgId,
                        content,
                        timestamp: Date.now(),
                        ...msg
                    };
                    const newMessages = [...state.messages, newMessage];

                    let newSessions = [...state.sessions];
                    let sessionIndex = newSessions.findIndex(s => s.id === state.currentSessionId);

                    // 如果没找到当前会话，新建一个兜底
                    if (sessionIndex === -1) {
                        const newId = state.currentSessionId || uuidv4();
                        const newSession: ChatSession = {
                            id: newId,
                            title: 'New Chat',
                            messages: [],
                            updatedAt: Date.now()
                        };
                        newSessions = [newSession, ...newSessions];
                        sessionIndex = 0;
                    }

                    const session = newSessions[sessionIndex];

                    // 只有在标题是默认值且是用户第一条消息时，才进行基础标题提取
                    // 后续会有 useAiChat 使用 AI 进行更精准的标题替换
                    let newTitle = session.title;
                    if ((session.title === 'New Chat' || !session.title) && msg.role === 'user') {
                        const text = typeof content === 'string' ? content : getTextContent(content);
                        newTitle = text.slice(0, 30) || 'New Chat';
                    }

                    newSessions[sessionIndex] = {
                        ...session,
                        messages: newMessages,
                        updatedAt: Date.now(),
                        title: newTitle
                    };

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

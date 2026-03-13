import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
import type { Message } from "./types";
import { usePlanStore } from "./tools/plan";
import { DEFAULT_MODEL } from "./store.constants";
import {
    applyMessageToSessions,
    buildDynamicSystemPrompt,
    createSessionMetadata,
    getModelById,
} from "./store.helpers";
import {
    deleteSessionMessages,
    loadSessionMessages,
    partializeAiMetaState,
    saveSessionMessages,
} from "./store.persistence";
import type { AiState } from "./store.types";

export const useAiStore = create<AiState>()(
    persist(
        (set, get) => ({
            models: [DEFAULT_MODEL],
            activeModelId: "default",
            activeVisionModelId: "default",
            activeSearchModelId: "default",
            enabledSearchProviders: ["google", "bing", "duckduckgo"],
            sessions: [],
            currentSessionId: null,
            messages: [],
            isLoading: false,
            isRestoring: false,

            getDynamicSystemPrompt: (config) => buildDynamicSystemPrompt(config),

            addModel: (modelData) =>
                set((state) => {
                    const newModel = {
                        ...modelData,
                        id: uuidv4(),
                        visionEnabled: modelData.visionEnabled ?? true,
                        enabledTools: modelData.enabledTools || [],
                    };
                    return {
                        models: [...state.models, newModel],
                        activeModelId: state.models.length === 0 ? newModel.id : state.activeModelId,
                        activeVisionModelId:
                            state.models.length === 0 ? newModel.id : state.activeVisionModelId,
                        activeSearchModelId:
                            state.models.length === 0 ? newModel.id : state.activeSearchModelId,
                    };
                }),

            updateModel: (id, updates) =>
                set((state) => ({
                    models: state.models.map((model) =>
                        model.id === id ? { ...model, ...updates } : model
                    ),
                })),

            deleteModel: (id) =>
                set((state) => {
                    const nextModels = state.models.filter((model) => model.id !== id);
                    const fallbackId = nextModels.length > 0 ? nextModels[0].id : null;

                    return {
                        models: nextModels,
                        activeModelId: state.activeModelId === id ? fallbackId : state.activeModelId,
                        activeVisionModelId:
                            state.activeVisionModelId === id ? fallbackId : state.activeVisionModelId,
                        activeSearchModelId:
                            state.activeSearchModelId === id ? fallbackId : state.activeSearchModelId,
                    };
                }),

            setActiveModel: (activeModelId) => set({ activeModelId }),
            setActiveVisionModel: (activeVisionModelId) => set({ activeVisionModelId }),
            setActiveSearchModel: (activeSearchModelId) => set({ activeSearchModelId }),
            setEnabledSearchProviders: (enabledSearchProviders) => set({ enabledSearchProviders }),

            getActiveModelConfig: () => {
                const state = get();
                return getModelById(state, state.activeModelId);
            },

            getActiveVisionModelConfig: () => {
                const state = get();
                return getModelById(state, state.activeVisionModelId || state.activeModelId);
            },

            getActiveSearchModelConfig: () => {
                const state = get();
                return getModelById(state, state.activeSearchModelId || state.activeModelId);
            },

            hydrateSession: async () => {
                const state = get();
                if (state.sessions.length === 0) {
                    await get().createSession();
                } else if (state.currentSessionId) {
                    await get().switchSession(state.currentSessionId);
                } else {
                    await get().switchSession(state.sessions[0].id);
                }
            },

            createSession: async () => {
                const newId = uuidv4();
                const newSession = createSessionMetadata(newId);
                set((state) => ({
                    sessions: [newSession, ...state.sessions],
                    currentSessionId: newId,
                    messages: [],
                }));
                usePlanStore.getState().reset();
                await saveSessionMessages(newId, []);
            },

            deleteSession: async (id) => {
                try {
                    await deleteSessionMessages(id);
                } catch (error) {}

                set((state) => {
                    const nextSessions = state.sessions.filter((session) => session.id !== id);
                    if (state.currentSessionId === id) {
                        return { sessions: nextSessions, currentSessionId: null, messages: [] };
                    }
                    return { sessions: nextSessions };
                });

                const state = get();
                if (!state.currentSessionId && state.sessions.length > 0) {
                    await get().switchSession(state.sessions[0].id);
                } else if (state.sessions.length === 0) {
                    await get().createSession();
                }
            },

            switchSession: async (id) => {
                const state = get();
                if (state.currentSessionId === id && state.messages.length > 0) {
                    return;
                }

                usePlanStore.getState().reset();
                set({ isRestoring: true, currentSessionId: id, messages: [] });

                try {
                    const messages = await loadSessionMessages(id);
                    set({ messages, isRestoring: false });
                } catch (error) {
                    set({ messages: [], isRestoring: false });
                }
            },

            updateSessionTitle: (id, title) =>
                set((state) => ({
                    sessions: state.sessions.map((session) =>
                        session.id === id ? { ...session, title } : session
                    ),
                })),

            addMessage: async (message) => {
                const messageId = message.id || uuidv4();
                const nextMessage: Message = {
                    id: messageId,
                    content: message.content || "",
                    timestamp: Date.now(),
                    ...message,
                } as Message;

                const nextMessages = [...get().messages, nextMessage];
                set({ messages: nextMessages });

                const state = get();
                const sessionId = state.currentSessionId;
                if (!sessionId) {
                    return messageId;
                }

                try {
                    await saveSessionMessages(sessionId, nextMessages);
                } catch (error) {}

                set((current) => ({
                    sessions: applyMessageToSessions(current.sessions, sessionId, message),
                }));

                return messageId;
            },

            updateMessage: async (id, updates) => {
                const nextMessages = get().messages.map((message) =>
                    message.id === id ? { ...message, ...updates } : message
                );
                set({ messages: nextMessages });

                const state = get();
                if (state.currentSessionId) {
                    await saveSessionMessages(state.currentSessionId, nextMessages);
                }
            },

            clearMessages: async () => {
                set({ messages: [] });
                const state = get();
                if (state.currentSessionId) {
                    await saveSessionMessages(state.currentSessionId, []);
                }
            },

            setLoading: (isLoading) => set({ isLoading }),
        }),
        {
            name: "app-ai-meta-storage",
            partialize: partializeAiMetaState,
        }
    )
);

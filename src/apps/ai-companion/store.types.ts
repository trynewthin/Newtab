import type { Message, ModelConfig } from "./types";

export interface SessionMetadata {
    id: string;
    title: string;
    updatedAt: number;
    preview?: string;
}

export interface AiStateData {
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
}

export interface AiStateActions {
    createSession: () => Promise<void>;
    deleteSession: (id: string) => Promise<void>;
    switchSession: (id: string) => Promise<void>;
    updateSessionTitle: (id: string, title: string) => void;
    addModel: (model: Omit<ModelConfig, "id">) => void;
    updateModel: (id: string, updates: Partial<ModelConfig>) => void;
    deleteModel: (id: string) => void;
    setActiveModel: (id: string) => void;
    setActiveVisionModel: (id: string | null) => void;
    setActiveSearchModel: (id: string | null) => void;
    setEnabledSearchProviders: (providers: string[]) => void;
    addMessage: (message: Partial<Message> & { role: Message["role"] }) => Promise<string>;
    updateMessage: (id: string, updates: Partial<Message>) => Promise<void>;
    clearMessages: () => Promise<void>;
    setLoading: (loading: boolean) => void;
    getActiveModelConfig: () => ModelConfig | undefined;
    getActiveVisionModelConfig: () => ModelConfig | undefined;
    getActiveSearchModelConfig: () => ModelConfig | undefined;
    getDynamicSystemPrompt: (config: ModelConfig) => string;
    hydrateSession: () => Promise<void>;
}

export type AiState = AiStateData & AiStateActions;

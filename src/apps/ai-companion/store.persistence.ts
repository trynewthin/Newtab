import { del as idbDel, get as idbGet, set as idbSet } from "idb-keyval";
import type { Message } from "./types";
import type { AiState } from "./store.types";

export async function loadSessionMessages(sessionId: string): Promise<Message[]> {
    return (await idbGet<Message[]>(sessionId)) || [];
}

export async function saveSessionMessages(
    sessionId: string,
    messages: Message[]
): Promise<void> {
    await idbSet(sessionId, messages);
}

export async function deleteSessionMessages(sessionId: string): Promise<void> {
    await idbDel(sessionId);
}

export function partializeAiMetaState(state: AiState) {
    return {
        models: state.models,
        activeModelId: state.activeModelId,
        activeVisionModelId: state.activeVisionModelId,
        activeSearchModelId: state.activeSearchModelId,
        enabledSearchProviders: state.enabledSearchProviders,
        sessions: state.sessions,
        currentSessionId: state.currentSessionId,
    };
}

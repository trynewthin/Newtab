import { getTextContent, type Message, type ModelConfig } from "./types";
import {
    BASE_AGENT_PROMPT,
    WEB_AGENT_TOOL_PROMPT,
} from "./store.constants";
import type { AiState, SessionMetadata } from "./store.types";

export function buildDynamicSystemPrompt(config: ModelConfig): string {
    let prompt = BASE_AGENT_PROMPT;

    if (config.visionEnabled) {
        const enabledTools = config.enabledTools || [];
        const hasWebAgent = enabledTools.some((tool) =>
            [
                "get_accessibility_tree",
                "click_by_id",
                "scroll",
                "type_text",
                "capture_screenshot",
                "navigate_to",
                "search_web",
            ].includes(tool)
        );
        if (hasWebAgent) {
            prompt += WEB_AGENT_TOOL_PROMPT;
        }
    }

    if (config.systemPrompt) {
        prompt += `\n## 用户追加指令:\n${config.systemPrompt}`;
    }

    return prompt;
}

export function getModelById(
    state: Pick<AiState, "models">,
    id: string | null | undefined
): ModelConfig | undefined {
    if (!id) {
        return undefined;
    }
    return state.models.find((model) => model.id === id);
}

export function createSessionMetadata(id: string): SessionMetadata {
    return {
        id,
        title: "New Chat",
        updatedAt: Date.now(),
        preview: "Start a new conversation...",
    };
}

export function applyMessageToSessions(
    sessions: SessionMetadata[],
    sessionId: string,
    message: Partial<Message> & { role: Message["role"] }
): SessionMetadata[] {
    return sessions.map((session) => {
        if (session.id !== sessionId) {
            return session;
        }

        let nextTitle = session.title;
        if (session.title === "New Chat" && message.role === "user") {
            const text =
                typeof message.content === "string"
                    ? message.content
                    : getTextContent(message.content);
            if (text) {
                nextTitle = text.slice(0, 30);
            }
        }

        return {
            ...session,
            updatedAt: Date.now(),
            preview:
                typeof message.content === "string"
                    ? message.content.slice(0, 50)
                    : "[Multimodal]",
            title: nextTitle,
        };
    });
}

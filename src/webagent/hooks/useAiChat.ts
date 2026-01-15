/**
 * useAiChat Hook - 多模态视觉 Web Agent (全功能控制版)
 */

import { useCallback, useRef } from 'react';
import { useAiStore } from '../store';
import { VISION_TOOLS, executeVisionTool } from '../vision';
import { prepareApiMessages } from '../utils';

export function useAiChat() {
    const {
        addMessage,
        updateMessage,
        setLoading,
        getActiveModelConfig,
        getActiveVisionModelConfig,
        getDynamicSystemPrompt,
        isLoading
    } = useAiStore();

    const stopSignalRef = useRef(false);
    const abortControllerRef = useRef<AbortController | null>(null);

    const stopGeneration = useCallback(() => {
        stopSignalRef.current = true;
        abortControllerRef.current?.abort();
        setLoading(false);
    }, [setLoading]);

    const callApi = async (reqMessages: any[]) => {
        const config = getActiveModelConfig();
        if (!config) throw new Error("No model configured");

        // 🔥 首先检查总开关，如果关闭则不传任何工具
        const isVisionEnabled = config.visionEnabled ?? true;
        const enabledToolNames = isVisionEnabled ? (config.enabledTools || []) : [];
        const activeTools = VISION_TOOLS.filter(t => enabledToolNames.includes(t.function.name));

        const response = await fetch(`${config.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${config.apiKey}` },
            body: JSON.stringify({
                model: config.model,
                messages: reqMessages,
                temperature: config.temperature ?? 0.1,
                tools: activeTools.length > 0 ? activeTools : undefined,
                tool_choice: activeTools.length > 0 ? "auto" : undefined
            })
        });
        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        return await response.json();
    };

    const runAgentLoop = async (initialUserText?: string) => {
        try {
            if (initialUserText) await addMessage({ role: 'user', content: initialUserText });

            const config = getActiveModelConfig();
            if (!config) return;

            const systemPrompt = getDynamicSystemPrompt(config);

            let step = 0;
            // 只有开启了总开关且有子工具时，才进入 ReAct 循环
            const isVisionEnabled = config.visionEnabled ?? true;
            const hasTools = isVisionEnabled && (config.enabledTools?.length ?? 0) > 0;
            const maxSteps = hasTools ? 10 : 1;

            while (step < maxSteps && !stopSignalRef.current) {
                step++;
                const apiMessages = prepareApiMessages(useAiStore.getState().messages, systemPrompt);
                const data = await callApi(apiMessages);
                const msg = data.choices?.[0]?.message;
                if (!msg) break;

                await addMessage({
                    role: 'assistant',
                    content: msg.content || '',
                    tool_calls: msg.tool_calls,
                    isIntermediate: !!msg.tool_calls
                });

                if (!msg.tool_calls) break;

                for (const tool of msg.tool_calls) {
                    const toolMsgId = await addMessage({
                        role: 'tool',
                        content: `📡 Delegating [${tool.function.name}] to Vision Agent...`,
                        tool_name: tool.function.name,
                        tool_call_id: tool.id
                    });

                    const visionConfig = getActiveVisionModelConfig();
                    const result = await executeVisionTool(tool.function.name, JSON.parse(tool.function.arguments), visionConfig);

                    await updateMessage(toolMsgId, { content: result });
                }
            }
        } catch (e: any) {
            await addMessage({ role: 'system', content: `❌ Error: ${e.message}` });
        } finally {
            setLoading(false);
        }
    };

    const sendMessage = useCallback(async (text?: string) => {
        if (isLoading) return;
        stopSignalRef.current = false;
        setLoading(true);
        await runAgentLoop(text);
    }, [isLoading, setLoading]);

    return { sendMessage, stopGeneration, isLoading };
}

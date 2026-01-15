/**
 * useAiChat Hook - 多模态视觉 Web Agent (全功能控制版)
 */

import { useCallback, useRef } from 'react';
import { useAiStore } from '../store';
import { VISION_TOOLS, executeVisionTool } from '../vision';
import { SYSTEM_TOOLS, executeSystemTool } from '../tools/system';
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

    const ALL_TOOLS = [...VISION_TOOLS, ...SYSTEM_TOOLS];

    const stopGeneration = useCallback(() => {
        stopSignalRef.current = true;
        abortControllerRef.current?.abort();
        setLoading(false);
    }, [setLoading]);

    const callApi = async (reqMessages: any[]) => {
        const config = getActiveModelConfig();
        if (!config) throw new Error("No model configured");

        // 🔥 过滤已启用的工具
        const enabledToolNames = config.enabledTools || [];

        const activeTools = ALL_TOOLS.filter(t => {
            // 系统工具也需要在这个列表里
            return enabledToolNames.includes(t.function.name);
        });

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
            const enabledToolNames = config.enabledTools || [];
            const hasTools = enabledToolNames.length > 0;
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
                    const toolName = tool.function.name;
                    const toolArgs = JSON.parse(tool.function.arguments);

                    const toolMsgId = await addMessage({
                        role: 'tool',
                        content: `📡 Executing [${toolName}]...`,
                        tool_name: toolName,
                        tool_call_id: tool.id
                    });

                    let result;
                    // 判断工具类型
                    if (VISION_TOOLS.some(t => t.function.name === toolName)) {
                        const visionConfig = getActiveVisionModelConfig();
                        result = await executeVisionTool(toolName, toolArgs, visionConfig);
                    } else if (SYSTEM_TOOLS.some(t => t.function.name === toolName)) {
                        result = await executeSystemTool(toolName, toolArgs);
                    } else {
                        result = `Error: Unknown tool ${toolName}`;
                    }

                    await updateMessage(toolMsgId, {
                        content: typeof result === 'string' ? result : JSON.stringify(result, null, 2)
                    });
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

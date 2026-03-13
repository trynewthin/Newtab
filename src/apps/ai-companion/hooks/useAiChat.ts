/**
 * useAiChat Hook - 多模态视觉 Web Agent (全功能控制版)
 */

import { useCallback, useRef } from 'react';
import { useAiStore } from '../store';
import { VISION_TOOLS, executeVisionTool } from '../vision';
import { SYSTEM_TOOLS, executeSystemTool } from '../tools/system';
import { PLAN_TOOLS, PLAN_TOOL_NAMES, executePlanTool } from '../tools/plan';
import { usePlanStore } from '../tools/plan';
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

    const ALL_TOOLS = [...VISION_TOOLS, ...SYSTEM_TOOLS, ...PLAN_TOOLS];

    const stopGeneration = useCallback(() => {
        stopSignalRef.current = true;
        abortControllerRef.current?.abort();
        abortControllerRef.current = null;
        setLoading(false);
    }, [setLoading]);

    const callApi = async (reqMessages: any[], attempt = 1): Promise<any> => {
        const config = getActiveModelConfig();
        if (!config) throw new Error("No model configured");

        // 🔥 过滤已启用的工具
        const enabledToolNames = config.enabledTools || [];
        const activeTools = ALL_TOOLS.filter(t => enabledToolNames.includes(t.function.name));

        const controller = new AbortController();
        abortControllerRef.current = controller;

        try {
            const response = await fetch(`${config.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${config.apiKey}` },
                body: JSON.stringify({
                    model: config.model,
                    messages: reqMessages,
                    temperature: config.temperature ?? 0.1,
                    tools: activeTools.length > 0 ? activeTools : undefined,
                    tool_choice: activeTools.length > 0 ? "auto" : undefined
                }),
                signal: controller.signal
            });

            if (!response.ok) {
                // Retry for transient errors
                if ([429, 500, 502, 503, 504].includes(response.status) && attempt < 3) {
                    await new Promise(r => setTimeout(r, 1000 * attempt));
                    return callApi(reqMessages, attempt + 1);
                }
                const errText = await response.text().catch(() => response.statusText);
                throw new Error(`API Error: ${response.status} ${errText.slice(0, 50)}...`);
            }
            return await response.json();
        } finally {
            abortControllerRef.current = null;
        }
    };

    const runAgentLoop = async (initialUserText?: string) => {
        // Record original tab so we can switch back after plan completes
        let originTabId: number | undefined;
        try {
            const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
            originTabId = activeTab?.id;
        } catch { /* ignore in non-extension env */ }

        try {
            if (initialUserText) await addMessage({ role: 'user', content: initialUserText });

            const config = getActiveModelConfig();
            if (!config) return;

            const systemPrompt = getDynamicSystemPrompt(config);

            let step = 0;
            const enabledToolNames = config.enabledTools || [];
            const hasTools = enabledToolNames.length > 0;
            const TOOL_PROGRESS_HINT_INTERVAL = 25;

            while (!stopSignalRef.current) {
                if (!hasTools && step >= 1) break;
                step++;
                const apiMessages = prepareApiMessages(useAiStore.getState().messages, systemPrompt);
                const data = await callApi(apiMessages);
                if (stopSignalRef.current) break;
                const msg = data.choices?.[0]?.message;
                if (!msg) break;
                const toolCalls = Array.isArray(msg.tool_calls)
                    ? msg.tool_calls.filter(Boolean)
                    : [];
                const hasToolCalls = toolCalls.length > 0;

                await addMessage({
                    role: 'assistant',
                    content: msg.content || '',
                    tool_calls: hasToolCalls ? toolCalls : undefined,
                    isIntermediate: hasToolCalls
                });

                // Detect plan complete → switch back to original tab
                if (!hasToolCalls) {
                    if (usePlanStore.getState().isComplete && originTabId) {
                        try { await chrome.tabs.update(originTabId, { active: true }); } catch { /* tab may be closed */ }
                    }
                    break;
                }

                for (const tool of toolCalls) {
                    if (stopSignalRef.current) break;
                    const toolName = tool.function.name;
                    let toolArgs: any = {};
                    try {
                        toolArgs = tool.function.arguments ? JSON.parse(tool.function.arguments) : {};
                    } catch {
                        toolArgs = {};
                    }

                    const toolMsgId = await addMessage({
                        role: 'tool',
                        content: `🔍 Executing [${toolName}]...`,
                        tool_name: toolName,
                        tool_call_id: tool.id
                    });

                    let result;
                    // 判断工具类型
                    if (PLAN_TOOL_NAMES.includes(toolName)) {
                        result = executePlanTool(toolName, toolArgs);
                    } else if (VISION_TOOLS.some(t => t.function.name === toolName)) {
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

                if (hasTools && step % TOOL_PROGRESS_HINT_INTERVAL === 0) {
                    await addMessage({
                        role: 'system',
                        content: '⏳ 工具链较长，正在继续执行。你也可以点击停止生成。',
                        isIntermediate: true
                    });
                }
            }
        } catch (e: any) {
            if (e?.name === 'AbortError' || stopSignalRef.current) return;
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

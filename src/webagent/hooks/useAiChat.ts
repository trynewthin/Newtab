/**
 * useAiChat Hook - 多模态视觉 Web Agent
 * 使用截图 + CDP 坐标点击的方案
 */

import { useCallback, useRef } from 'react';
import { useAiStore } from '../store';
import type { Message, TaskPlan } from '../types';
import { getTextContent } from '../types';
import { TOOLS, executeToolCall } from '../tools';

// 增强版：视觉代理的系统提示 - 强化浏览器环境意识
const VISION_AGENT_PROMPT = `You are a professional Multimodal Web Agent. You operate a real-time Chrome browser environment using visual feedback and coordinate-based interactions.

## Your Identity:
- You are not just a chatbot; you are a browser operator.
- Your primary input is the visual screenshot of the current viewport.
- Your primary output is controlled actions via Chrome DevTools Protocol.

## Interaction Strategy:
1. **Observation-Led**: Every decision MUST be based on what you see in the latest screenshot.
2. **Precise Targetting**: When clicking, estimate the (x, y) coordinates of the CENTER of the UI element.
3. **Verification**: Web pages are volatile. After clicking or typing, always \`capture_screenshot\` again to ensure the page responded as expected.
4. **Resilience**: If an element is not visible, it might be off-screen (use \`scroll\`) or behind a menu (click the menu first).

## Coordinate Reference:
- Origin (0, 0) is the top-left corner of the viewport.
- Standard viewport is 1280x720 pixels.
- Use absolute pixel values for \`click_at\`.

## Critical Execution Rule:
Before each action, briefly state what you see in the screenshot and why you are taking the next action. This helps the user follow your "thought process" on the web page.

Respond in Chinese for all user-facing explanations.`;

export function useAiChat() {
    const addMessage = useAiStore(s => s.addMessage);
    const updateMessage = useAiStore(s => s.updateMessage);
    const updateSessionTitle = useAiStore(s => s.updateSessionTitle);
    const setLoading = useAiStore(s => s.setLoading);
    const getActiveModelConfig = useAiStore(s => s.getActiveModelConfig);
    const isLoading = useAiStore(s => s.isLoading);
    const currentSessionId = useAiStore(s => s.currentSessionId);
    const stopSignalRef = useRef(false);
    const abortControllerRef = useRef<AbortController | null>(null);

    const stopGeneration = useCallback(() => {
        stopSignalRef.current = true;
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        setLoading(false);
    }, [setLoading]);

    /**
     * 获取当前页面的动态上下文 (URL, Title 等)
     */
    const getPageContext = async () => {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab) {
                return `\n\n### Current Page Context:\n- URL: ${tab.url}\n- Title: ${tab.title}\n- Tab ID: ${tab.id}`;
            }
        } catch (e) { }
        return "";
    };

    /**
     * 准备 API 消息 - 支持多模态
     */
    const prepareApiMessages = (
        history: Message[],
        systemPrompt: string
    ): any[] => {
        if (stopSignalRef.current) return [];

        const messages: any[] = [{ role: 'system', content: systemPrompt }];

        // 处理历史消息
        for (const msg of history) {
            if (msg.role === 'assistant' && !msg.content && (!msg.tool_calls || msg.tool_calls.length === 0)) {
                continue;
            }

            const apiMsg: any = { role: msg.role };

            if (msg.role === 'tool') {
                apiMsg.tool_call_id = msg.tool_call_id;
                apiMsg.name = msg.tool_name || 'unknown';
                const content = typeof msg.content === 'string' ? msg.content : getTextContent(msg.content);

                if (content.startsWith('IMAGE_DATA:')) {
                    const dataUrl = content.replace('IMAGE_DATA:', '');
                    apiMsg.content = "Screenshot captured successfully.";
                    messages.push(apiMsg);
                    messages.push({
                        role: 'user',
                        content: [
                            { type: 'text', text: 'Here is the latest live screenshot from the browser:' },
                            { type: 'image_url', image_url: { url: dataUrl, detail: 'high' } }
                        ]
                    });
                    continue;
                }
                apiMsg.content = content;
            }
            else if (msg.role === 'assistant') {
                const content = typeof msg.content === 'string' ? msg.content : getTextContent(msg.content);
                apiMsg.content = content || " ";
                if (msg.tool_calls?.length) {
                    apiMsg.tool_calls = msg.tool_calls;
                }
            }
            else if (msg.role === 'user') {
                apiMsg.content = Array.isArray(msg.content) ? msg.content : (msg.content || " ");
            }
            else {
                apiMsg.content = typeof msg.content === 'string' ? msg.content : getTextContent(msg.content);
            }

            messages.push(apiMsg);
        }

        // 合并连续消息
        const consolidated: any[] = [];
        for (const msg of messages) {
            if (consolidated.length === 0) {
                consolidated.push(msg);
                continue;
            }
            const lastMsg = consolidated[consolidated.length - 1];
            if (lastMsg.role === msg.role && msg.role !== 'tool' && msg.role !== 'system') {
                if (typeof lastMsg.content === 'string' && typeof msg.content === 'string') {
                    lastMsg.content = (lastMsg.content + '\n\n' + msg.content).trim();
                } else {
                    const lastContent = Array.isArray(lastMsg.content) ? lastMsg.content : [{ type: 'text', text: lastMsg.content }];
                    const newContent = Array.isArray(msg.content) ? msg.content : [{ type: 'text', text: msg.content }];
                    lastMsg.content = [...lastContent, ...newContent];
                }
                if (msg.tool_calls) {
                    lastMsg.tool_calls = [...(lastMsg.tool_calls || []), ...msg.tool_calls];
                }
            } else {
                consolidated.push(msg);
            }
        }
        return consolidated;
    };

    /**
     * 调用 API
     */
    const callApi = async (reqMessages: any[], useTools = true, allowedTools?: string[]): Promise<any> => {
        if (stopSignalRef.current) throw new Error("Aborted by user");
        const config = getActiveModelConfig();
        if (!config) throw new Error("No model configured");

        const filteredTools = allowedTools
            ? TOOLS.filter(t => allowedTools.includes(t.function.name))
            : TOOLS;

        const controller = new AbortController();
        abortControllerRef.current = controller;

        try {
            const response = await fetch(`${config.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${config.apiKey}`
                },
                signal: controller.signal,
                body: JSON.stringify({
                    model: config.model,
                    messages: reqMessages,
                    temperature: config.temperature ?? 0.1,
                    max_tokens: 4096,
                    tools: useTools && filteredTools.length > 0 ? filteredTools : undefined,
                    tool_choice: useTools && filteredTools.length > 0 ? "auto" : undefined
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API Error: ${response.status} - ${errorText}`);
            }
            return await response.json();
        } finally {
            abortControllerRef.current = null;
        }
    };

    /**
     * 发送消息
     */
    const sendMessage = useCallback(async (userText?: string) => {
        if (isLoading) return;
        stopSignalRef.current = false;

        try {
            setLoading(true);
            const activeModel = getActiveModelConfig();
            if (!activeModel) throw new Error("请先配置 AI 模型");

            if (userText) addMessage({ role: 'user', content: userText });

            const currentMessages = useAiStore.getState().messages;
            const isFirstMessage = currentMessages.length <= 2;

            // 1. 获取初始上下文和截图
            const pageContext = await getPageContext();
            let initialScreenshot: string | null = null;
            try {
                const screenshotResult = await executeToolCall("capture_screenshot", {});
                if (screenshotResult.startsWith('IMAGE_DATA:')) {
                    initialScreenshot = screenshotResult.replace('IMAGE_DATA:', '');
                }
            } catch (e) {
                console.warn("Initial screenshot failed:", e);
            }

            const baseSystemPrompt = activeModel.systemPrompt
                ? `${VISION_AGENT_PROMPT}\n\n${activeModel.systemPrompt}`
                : VISION_AGENT_PROMPT;

            // 实时系统提示包含当前页面信息
            const dynamicSystemPrompt = `${baseSystemPrompt}${pageContext}`;

            // 2. 规划任务
            let taskPlan: TaskPlan | null = null;
            let planMsgId: string | undefined;

            const planningMessages = prepareApiMessages(useAiStore.getState().messages, dynamicSystemPrompt);
            if (initialScreenshot && !stopSignalRef.current) {
                planningMessages.push({
                    role: 'user',
                    content: [
                        { type: 'text', text: 'I am currently on this page. Help me plan the steps to achieve the goal.' },
                        { type: 'image_url', image_url: { url: initialScreenshot, detail: 'high' } }
                    ]
                });
            }

            const planningData = await callApi(planningMessages, true, ["set_task_plan", "capture_screenshot"]);
            const planningMsg = planningData.choices?.[0]?.message;

            if (planningMsg?.tool_calls?.some((tc: any) => tc.function.name === 'set_task_plan')) {
                const toolCall = planningMsg.tool_calls.find((tc: any) => tc.function.name === 'set_task_plan');
                let args;
                try {
                    args = JSON.parse(toolCall.function.arguments);
                } catch (e) {
                    args = { type: 'chain', steps: [] };
                }
                taskPlan = { type: args.type || 'chain', steps: args.steps || [], currentIndex: 0 };

                addMessage({ role: 'assistant', content: planningMsg.content || "", tool_calls: planningMsg.tool_calls, isIntermediate: true });
                addMessage({ role: 'tool', content: "Roadmap set.", tool_name: 'set_task_plan', tool_call_id: toolCall.id, isIntermediate: true });
                planMsgId = addMessage({ role: 'assistant', content: "📋 我已制定执行计划", plan: taskPlan, isIntermediate: true });
            } else {
                taskPlan = { type: 'chain', steps: [{ description: userText || "执行任务" }], currentIndex: 0 };
                planMsgId = addMessage({ role: 'assistant', content: "开始执行...", plan: taskPlan, isIntermediate: true });
            }

            // 3. 执行步骤
            const stepResults: string[] = [];
            if (taskPlan) {
                for (let i = 0; i < taskPlan.steps.length; i++) {
                    if (stopSignalRef.current) break;
                    if (planMsgId) updateMessage(planMsgId, { plan: { ...taskPlan, currentIndex: i } });

                    const currentStep = taskPlan.steps[i];
                    let stepDone = false;
                    let stepAttempts = 0;
                    const maxAttempts = 8;

                    while (!stepDone && stepAttempts < maxAttempts) {
                        if (stopSignalRef.current) break;
                        stepAttempts++;

                        const currentPageContext = await getPageContext();
                        const stepSystemPrompt = `${baseSystemPrompt}${currentPageContext}

## CURRENT OBJECTIVE:
Your current step is: "${currentStep.description}"

## INSTRUCIONS:
1. LOOK at the latest screenshot.
2. THINK what action is needed (click, type, scroll).
3. EXECUTE the action using tools.
4. When you are CERTAIN this step is finished, say "STEP_COMPLETE" followed by a summary.`;

                        const execMessages = prepareApiMessages(useAiStore.getState().messages, stepSystemPrompt);
                        const execData = await callApi(execMessages, true, TOOLS.filter(t => t.function.name !== 'set_task_plan').map(t => t.function.name));
                        const execMsg = execData.choices?.[0]?.message;

                        if (execMsg?.tool_calls?.length) {
                            addMessage({ role: 'assistant', content: execMsg.content || "", tool_calls: execMsg.tool_calls, isIntermediate: true });
                            for (const tc of execMsg.tool_calls) {
                                if (stopSignalRef.current) break;
                                const toolMsgId = addMessage({ role: 'tool', content: "Processing...", tool_name: tc.function.name, tool_call_id: tc.id, isIntermediate: true });
                                const result = await executeToolCall(tc.function.name, JSON.parse(tc.function.arguments));
                                updateMessage(toolMsgId, { content: result });
                                if (['click_at', 'type_text', 'navigate', 'scroll'].includes(tc.function.name)) {
                                    await new Promise(r => setTimeout(r, 1200));
                                }
                            }
                        } else if (execMsg?.content) {
                            const content = execMsg.content;
                            addMessage({ role: 'assistant', content, isIntermediate: true });
                            if (content.includes("STEP_COMPLETE") || content.includes("步骤完成")) {
                                stepDone = true;
                                stepResults.push(content.replace(/STEP_COMPLETE/g, "").trim());
                            }
                        } else {
                            stepDone = true;
                        }
                    }
                }
            }

            // 4. 最终总结
            if (!stopSignalRef.current) {
                if (planMsgId && taskPlan) updateMessage(planMsgId, { plan: { ...taskPlan, currentIndex: taskPlan.steps.length } });
                const summaryData = await callApi([
                    { role: 'system', content: baseSystemPrompt },
                    { role: 'user', content: `Task completed. Summary the execution results in Chinese.\n\nUser Request: ${userText}\n\nStep Summaries:\n${stepResults.join('\n')}` }
                ], false);
                const summaryContent = summaryData.choices?.[0]?.message?.content || "任务执行完毕。";
                addMessage({ role: 'assistant', content: summaryContent, isSummary: true });

                if (isFirstMessage) {
                    try {
                        const titleData = await callApi([
                            { role: 'system', content: "你是一个标题助手，返回一个 10 字以内的中文简要标题，不带标点。" },
                            { role: 'user', content: `摘要内容：${summaryContent}` }
                        ], false);
                        const newTitle = titleData.choices?.[0]?.message?.content?.trim();
                        if (newTitle) updateSessionTitle(currentSessionId, newTitle);
                    } catch (e) { }
                }
            }
        } catch (error: any) {
            if (error.message !== "Aborted") {
                addMessage({ role: 'system', content: `❌ 错误: ${error.message}` });
            }
        } finally {
            setLoading(false);
        }
    }, [addMessage, updateMessage, updateSessionTitle, setLoading, getActiveModelConfig, isLoading, currentSessionId]);

    return { sendMessage, stopGeneration, isLoading };
}

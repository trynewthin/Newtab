import { useCallback, useRef } from 'react';
import { useAiStore } from '@/store/modules/ai';
import type { Message, TaskPlan } from '@/store/modules/ai';
import { TOOLS, executeToolCall } from '@/lib/ai/tools';

export function useAiChat() {
    const addMessage = useAiStore(s => s.addMessage);
    const updateMessage = useAiStore(s => s.updateMessage);
    const setLoading = useAiStore(s => s.setLoading);
    const getActiveModelConfig = useAiStore(s => s.getActiveModelConfig);
    const isLoading = useAiStore(s => s.isLoading);
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

    const prepareApiMessages = (history: Message[], systemPrompt: string, mode: 'full' | 'isolated' | 'tiny' = 'full') => {
        if (stopSignalRef.current) return [];

        let sourceMessages = [...history];
        const cleaned: Message[] = [];
        let i = 0;

        while (i < sourceMessages.length) {
            const m = sourceMessages[i];
            if (m.role === 'user') {
                let nextSummaryIdx = -1;
                for (let j = i + 1; j < sourceMessages.length; j++) {
                    if (sourceMessages[j].role === 'user') break;
                    if (sourceMessages[j].isSummary) { nextSummaryIdx = j; break; }
                }
                if (nextSummaryIdx !== -1) {
                    cleaned.push(m);
                    cleaned.push(sourceMessages[nextSummaryIdx]);
                    i = nextSummaryIdx + 1;
                    continue;
                }
            }
            cleaned.push(m);
            i++;
        }

        let startIdx = 0;
        if (mode === 'tiny') startIdx = Math.max(0, cleaned.length - 3);
        else if (mode === 'isolated') startIdx = Math.max(0, cleaned.length - 15);

        while (startIdx > 0 && cleaned[startIdx].role !== 'user') startIdx--;

        // 关键 Prompt 注入：每一条发往 API 的 System Message 都要强调 ID 约束
        const strictToolsPrompt = `${systemPrompt}
### TOOL USAGE RULES (CRITICAL):
1. **Interactive Elements Only**: You can ONLY interact with elements that have an \`id="ai-..."\` shown in the Context.
2. **NO Guessing**: Do NOT click elements by text content (e.g., "Login"). You MUST find the \`ai-xxxxx\` ID from \`get_page_structure\` first.
3. **Execution Flow**: If you don't know the ID, call \`get_page_structure\` FIRST. Do NOT hallucinate IDs.
`;

        let sliced = cleaned.slice(startIdx);
        const raw = sliced.map(m => ({
            role: m.role,
            content: m.content || " ",
            tool_calls: (m.role === 'assistant' && m.tool_calls?.length) ? m.tool_calls : undefined,
            tool_call_id: m.role === 'tool' ? m.tool_call_id : undefined,
            name: m.role === 'tool' ? (m.tool_name || "system_tool") : undefined
        }));

        const consolidated: any[] = [];
        raw.forEach(m => {
            if (consolidated.length > 0) {
                const prev = consolidated[consolidated.length - 1];
                if (prev.role === m.role && m.role !== 'tool') {
                    prev.content = (prev.content + "\n\n" + m.content).trim() || " ";
                    if (m.role === 'assistant' && m.tool_calls) {
                        prev.tool_calls = [...(prev.tool_calls || []), ...m.tool_calls];
                    }
                    return;
                }
            }
            consolidated.push(m);
        });

        const final: any[] = [{ role: 'system', content: strictToolsPrompt }];
        let imagesBuffer: string[] = [];
        consolidated.forEach((m, idx) => {
            if (m.role === 'tool' && typeof m.content === 'string' && m.content.startsWith('IMAGE_DATA:')) {
                const dataUrl = m.content.replace('IMAGE_DATA:', '');
                m.content = "Snapshot received.";
                imagesBuffer.push(dataUrl);
            }
            final.push(m);
            const next = consolidated[idx + 1];
            if (imagesBuffer.length > 0 && !(m.tool_calls || (next && next.role === 'tool'))) {
                final.push({
                    role: 'user',
                    content: [{ type: "text", text: "Visual Evidence:" }, ...imagesBuffer.map(url => ({ type: "image_url", image_url: { url } }))]
                });
                imagesBuffer = [];
            }
        });

        const last = final[final.length - 1];
        if (last && (last.role === 'system' || (last.role === 'assistant' && !last.tool_calls))) {
            final.push({ role: 'user', content: "Continue in Chinese. Use defined Tools." });
        }
        return final;
    };

    const callApi = async (reqMessages: any[], useTools = true, allowedTools?: string[]) => {
        if (stopSignalRef.current) throw new Error("Aborted by user");
        const config = getActiveModelConfig();
        if (!config) throw new Error("No model");
        const filteredTools = allowedTools ? TOOLS.filter((t: any) => allowedTools.includes(t.function.name)) : TOOLS;
        const controller = new AbortController();
        abortControllerRef.current = controller;

        try {
            const response = await fetch(`${config.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${config.apiKey}` },
                signal: controller.signal,
                body: JSON.stringify({
                    model: config.model,
                    messages: reqMessages,
                    temperature: 0.1,
                    tools: useTools && filteredTools.length > 0 ? filteredTools : undefined,
                    tool_choice: useTools && filteredTools.length > 0 ? "auto" : undefined
                })
            });
            if (!response.ok) throw new Error(await response.text());
            return await response.json();
        } finally {
            abortControllerRef.current = null;
        }
    };

    const sendMessage = useCallback(async (userText?: string) => {
        if (isLoading) return;
        stopSignalRef.current = false;

        try {
            setLoading(true);
            const activeModel = getActiveModelConfig();
            if (!activeModel) return;

            let pageDom = "";
            if (!stopSignalRef.current) {
                try { pageDom = String(await executeToolCall("get_page_structure", {})); } catch (e) { }
            }

            let objective = userText || "";
            if (userText) {
                addMessage({ role: 'user', content: userText });
                const currentHistory = useAiStore.getState().messages;
                const injectedHistory = [...currentHistory];
                const lastMsg = injectedHistory[injectedHistory.length - 1];

                if (lastMsg.role === 'user') {
                    injectedHistory[injectedHistory.length - 1] = {
                        ...lastMsg,
                        content: `[User Request]: ${userText}\n\n[Full Page Context (Semantic DOM Tree) for ID Lookup]:\n${pageDom}`
                    };
                }

                if (!stopSignalRef.current) {
                    const intentPrompt = "Extract user intent. Ground all pronouns ('this', 'that') in the provided Page Context. Respond in Chinese.";
                    const analysisData = await callApi(prepareApiMessages(injectedHistory, intentPrompt, 'tiny'), false);
                    objective = analysisData.choices?.[0]?.message?.content || userText;
                }
            }

            if (stopSignalRef.current) throw new Error("Aborted");

            let taskPlan: TaskPlan | null = null;
            let planMsgId: string | undefined;

            // Planning Prompt 注入 ID 约束
            const planningPrompt = `${activeModel.systemPrompt}\n\nObjective: [${objective}]\nRule: You established the plan. You MUST use \`get_page_structure\` to find \`ai-...\` IDs if not already visible. Call \`set_task_plan\`.`;

            const currentHistory = useAiStore.getState().messages;
            const groundingHistory = [...currentHistory];
            const lastUserIdx = [...groundingHistory].reverse().findIndex(m => m.role === 'user');
            if (lastUserIdx !== -1) {
                const idx = groundingHistory.length - 1 - lastUserIdx;
                groundingHistory[idx] = { ...groundingHistory[idx], content: `[User Request]: ${userText}\n\n[DOM Context]:\n${pageDom}` };
            }

            const planningData = await callApi(prepareApiMessages(groundingHistory, planningPrompt), true, ["set_task_plan"]);
            if (stopSignalRef.current) throw new Error("Aborted");

            const planningMsg = planningData.choices?.[0]?.message;

            if (planningMsg?.tool_calls?.some((tc: any) => tc.function.name === 'set_task_plan')) {
                const toolCall = planningMsg.tool_calls.find((tc: any) => tc.function.name === 'set_task_plan');
                // 简单的参数修复：如果 AI 还是发疯返回了 string 而不是 object，尝试 parse
                let args;
                try {
                    args = typeof toolCall.function.arguments === 'string' ? JSON.parse(toolCall.function.arguments) : toolCall.function.arguments;
                } catch (e) { args = { type: 'parallel', steps: [] }; }

                taskPlan = { type: args.type, steps: args.steps.map((s: any) => ({ description: s.description })), currentIndex: 0 };

                if (!stopSignalRef.current) {
                    addMessage({ role: 'assistant', content: "", tool_calls: planningMsg.tool_calls, isIntermediate: true });
                    addMessage({ role: 'tool', content: "Plan Prepared", tool_name: 'set_task_plan', tool_call_id: toolCall.id, isIntermediate: true });
                    planMsgId = addMessage({ role: 'assistant', content: "📋 Task Dispatched", plan: taskPlan, isIntermediate: true });
                }
            } else {
                taskPlan = { type: 'parallel', steps: [{ description: objective }], currentIndex: 0 };
                if (!stopSignalRef.current) {
                    planMsgId = addMessage({ role: 'assistant', content: "Starting...", plan: taskPlan, isIntermediate: true });
                }
            }

            const stepResults: string[] = [];
            if (taskPlan) {
                for (let i = 0; i < taskPlan.steps.length; i++) {
                    if (stopSignalRef.current) break;
                    if (planMsgId) updateMessage(planMsgId, { plan: { ...taskPlan, currentIndex: i } });

                    let stepDone = false, stepAttempts = 0;
                    const currentStep = taskPlan.steps[i];

                    // Task Execution Prompt 注入 ID 约束
                    let stepPrompt = `${activeModel.systemPrompt}\n\n### Current Task: [${currentStep.description}]\nCRITICAL: Use \`click_element\` with \`ai-...\` IDs only. If ID is unknown, call \`get_page_structure\`. Reply "DONE_STEP" after completion.`;

                    while (!stepDone && stepAttempts < 5) {
                        if (stopSignalRef.current) break;
                        stepAttempts++;
                        const execData = await callApi(prepareApiMessages(useAiStore.getState().messages, stepPrompt, 'isolated'), true, TOOLS.filter(t => t.function.name !== 'set_task_plan').map(t => t.function.name));
                        if (stopSignalRef.current) break;

                        const execMsg = execData.choices?.[0]?.message;

                        if (execMsg.tool_calls) {
                            addMessage({ role: 'assistant', content: execMsg.content || "", tool_calls: execMsg.tool_calls, isIntermediate: true });
                            for (const tc of execMsg.tool_calls) {
                                if (stopSignalRef.current) break;
                                const tId = addMessage({ role: 'tool', content: "", tool_name: tc.function.name, tool_call_id: tc.id, isIntermediate: true });

                                // 工具执行参数解析与保护
                                let tArgs = {};
                                try { tArgs = JSON.parse(tc.function.arguments); } catch (e) { tArgs = {} }

                                const result = await executeToolCall(tc.function.name, tArgs);
                                if (!stopSignalRef.current) {
                                    updateMessage(tId, { content: String(result) });
                                    if (tc.function.name === 'click_element' || tc.function.name === 'scroll_page') await new Promise(r => setTimeout(r, 1000));
                                }
                            }
                        } else if (execMsg.content) {
                            addMessage({ role: 'assistant', content: execMsg.content, isIntermediate: true });
                            if (execMsg.content.includes("DONE_STEP") || i === taskPlan.steps.length - 1) {
                                stepDone = true;
                                stepResults.push(execMsg.content.replace("DONE_STEP", "").trim() || "Step complete.");
                            }
                        } else { stepDone = true; }
                    }
                }
            }

            if (!stopSignalRef.current) {
                if (planMsgId && taskPlan) updateMessage(planMsgId, { plan: { ...taskPlan, currentIndex: taskPlan.steps.length } });
                const finalPrompt = `[Final Summary] Provide final Chinese response based on browser outcomes. Goal: ${objective}\nOutcomes:\n${stepResults.join('\n')}`;
                const finalData = await callApi([{ role: 'system', content: activeModel.systemPrompt }, { role: 'user', content: finalPrompt }], false);
                if (!stopSignalRef.current) {
                    addMessage({ role: 'assistant', content: finalData.choices?.[0]?.message?.content || "任务已完成。", isSummary: true });
                }
            }
        } catch (error: any) {
            if (error.message !== "Aborted by user" && error.message !== "Aborted") {
                console.error(error);
                if (!stopSignalRef.current) addMessage({ role: 'system', content: `Error: ${error.message}` });
            }
        } finally {
            if (useAiStore.getState().isLoading) {
                setLoading(false);
            }
        }
    }, [addMessage, updateMessage, setLoading, getActiveModelConfig, isLoading]);

    return { sendMessage, stopGeneration, isLoading };
}

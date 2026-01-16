/**
 * Vision Agent - 宸ュ叿閫昏緫涓庢ā鍨嬪鎵?(涓ユ牸 JSON 鐗?
 */

import type { ToolDefinition, ModelConfig } from '../types';
import * as core from './core';
import { useVisionState } from './state';

export const VISION_TOOLS: ToolDefinition[] = [
    {
        type: "function",
        function: {
            name: "get_semantic_map",
            description: "Analyze the page and return a STRICT JSON map of entities and action IDs.",
            parameters: { type: "object", properties: {}, required: [] }
        }
    },
    {
        type: "function",
        function: {
            name: "click_by_id",
            description: "Click an element by its [ID] from the semantic map.",
            parameters: {
                type: "object",
                properties: { id: { type: "number" } },
                required: ["id"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "scroll",
            description: "Scroll the page or a specific container.",
            parameters: {
                type: "object",
                properties: {
                    direction: { type: "string", enum: ["up", "down"] },
                    amount: { type: "number" },
                    id: { type: "number", description: "Optional: ID of a specific scrollable container." }
                },
                required: ["direction"]
            }
        }
    }
];

export const VISION_TOOL_NAMES = VISION_TOOLS.map(t => t.function.name);

let idToSelectorMap: Map<number, string> = new Map();

/**
 * 鎻愬彇 JSON 瀛楃涓诧紙澶勭悊鍙兘瀛樺湪鐨?Markdown 鍖呰９锛?
 */
function extractJson(text: string): string {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return jsonMatch[0];
    return text.replace(/```json|```/g, '').trim();
}

export async function executeVisionTool(toolName: string, toolArgs: any, config?: ModelConfig): Promise<any> {
    const tab = await core.getActiveTab();
    if (!tab?.id) return "Error: No active tab found.";
    const tabId = tab.id;
    const { setStatus, setError } = useVisionState.getState();

    try {
        switch (toolName) {
            case "get_semantic_map": {
                if (!config) return "Error: Config missing.";

                setStatus('capturing');
                const screenshot = await core.captureViewport(tab.windowId);
                await core.attachDebugger(tabId);

                const script = `
                    (function() {
                        const items = [];
                        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
                        let node, idCounter = 0;

                        function getPath(el) {
                            if (el.id) return '#' + el.id;
                            const path = [];
                            while (el && el.nodeName !== 'BODY') {
                                let selector = el.nodeName.toLowerCase();
                                let sibling = el, nth = 1;
                                while (sibling = sibling.previousElementSibling) {
                                    if (sibling.nodeName === el.nodeName) nth++;
                                }
                                selector += \`:nth-of-type(\${nth})\`;
                                path.unshift(selector);
                                el = el.parentNode;
                            }
                            return path.join(' > ');
                        }

                        while(node = walker.nextNode()) {
                            const rect = node.getBoundingClientRect();
                            if (rect.width < 5 || rect.height < 5) continue;
                            const isVisible = (
                                rect.top >= -200 && rect.left >= -200 &&
                                rect.bottom <= window.innerHeight + 200 && rect.right <= window.innerWidth + 200
                            );
                            if (!isVisible) continue;
                            
                            const style = window.getComputedStyle(node);
                            const isScrollable = (node.scrollHeight > node.clientHeight + 10) && 
                                               (style.overflowY === 'auto' || style.overflowY === 'scroll');
                            
                            const isClickable = ['BUTTON', 'A', 'INPUT'].includes(node.tagName) || 
                                              style.cursor === 'pointer' || 
                                              node.getAttribute('role') === 'button' ||
                                              isScrollable;

                            if (isClickable) {
                                const id = idCounter++;
                                items.push({
                                    id: id,
                                    selector: getPath(node),
                                    tag: node.tagName,
                                    text: (node.innerText || "").trim().slice(0, 30),
                                    x: Math.round(rect.left + rect.width / 2),
                                    y: Math.round(rect.top + rect.height / 2),
                                    type: isScrollable ? 'scrollable' : 'clickable'
                                });
                            }
                        }
                        return items;
                    })()
                `;
                const res = await core.sendCDPCommand(tabId, "Runtime.evaluate", { expression: script, returnByValue: true });
                const domItems = res.result?.value || [];

                idToSelectorMap.clear();
                domItems.forEach((it: any) => idToSelectorMap.set(it.id, it.selector));

                const flatList = domItems.map((i: any) => `[ID ${i.id}] Type: ${i.type}, at (${i.x}, ${i.y}) - ${i.text}`).join('\n');

                setStatus('analyzing');

                // 馃敟 寮哄埗 JSON 杈撳嚭鎸囦护
                const visionPrompt = `You are a UI Architect.
Analyze the screenshot and the list of IDs. 

## CORE TASK:
Identify "ENTITIES" (components like "Sidebar", "Main Video", "Comment List").

## RULES:
1. ONLY OUTPUT A VALID JSON OBJECT. 
2. NO PREAMBLE, NO EXPLANATION, NO MARKDOWN OUTSIDE THE JSON.
3. Group action IDs by Entity.
4. If an ID is marked as "Type: scrollable", set "isScrollable": true for that Entity.

JSON Structure:
{"entities": [{"name": "...", "isScrollable": true, "actions": [{"id": 0, "label": "..."}]}]}`;

                const resp = await fetch(`${config.baseUrl}/chat/completions`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${config.apiKey}` },
                    body: JSON.stringify({
                        model: config.model,
                        messages: [
                            { role: 'system', content: visionPrompt },
                            {
                                role: 'user', content: [
                                    { type: 'text', text: `Elements:\n${flatList}` },
                                    { type: 'image_url', image_url: { url: screenshot } }
                                ]
                            }
                        ],
                        temperature: 0,
                        // 鏌愪簺妯″瀷鏀寔寮鸿鎸囧畾 JSON 妯″紡
                        response_format: { type: "json_object" }
                    })
                });

                const data = await resp.json();
                const rawResponse = data?.choices?.[0]?.message?.content || "{}";

                // 馃敟 寮哄埗娓呮礂缁撴灉锛屽彧淇濈暀 JSON 閮ㄥ垎
                const cleanJson = extractJson(rawResponse);

                setStatus('success');
                return {
                    __type: "vision_result",
                    input: { screenshot, domCount: domItems.length, domTree: domItems },
                    rawResponse, // 淇濈暀鍘熷鍝嶅簲渚?Debug
                    finalResult: cleanJson // 浜や粯缁欎富 Agent 鐨勭函鍑€ JSON
                };
            }

            case "click_by_id": {
                const { id } = toolArgs;
                const selector = idToSelectorMap.get(id);
                if (!selector) return `Error: ID ${id} missing.`;
                await core.attachDebugger(tabId);
                const resolveScript = `
                    (function() {
                        const el = document.querySelector(\`${selector.replace(/`/g, '\\`')}\`);
                        if (!el) return null;
                        const r = el.getBoundingClientRect();
                        return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
                    })()
                `;
                const res = await core.sendCDPCommand(tabId, "Runtime.evaluate", { expression: resolveScript, returnByValue: true });
                const target = res.result?.value;
                if (!target) return "Error: Element not found.";
                const { x, y } = target;
                await core.sendCDPCommand(tabId, "Input.dispatchMouseEvent", { type: "mouseMoved", x, y });
                await core.sendCDPCommand(tabId, "Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 });
                await core.sendCDPCommand(tabId, "Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: 1 });
                await core.sendCDPCommand(tabId, "Runtime.evaluate", { expression: `document.querySelector(\`${selector.replace(/`/g, '\\`')}\`)?.click()` });
                return `SUCCESS: Clicked [${id}] at (${x}, ${y}).`;
            }

            case "scroll": {
                const { direction, amount = 500, id } = toolArgs;
                const dy = direction === "down" ? amount : -amount;
                await core.attachDebugger(tabId);

                if (id !== undefined) {
                    const selector = idToSelectorMap.get(id);
                    if (selector) {
                        const scrollScript = `
                            (function() {
                                const el = document.querySelector(\`${selector.replace(/`/g, '\\`')}\`);
                                if (el) {
                                    el.scrollBy({ top: ${dy}, behavior: 'smooth' });
                                    return true;
                                }
                                return false;
                            })()
                        `;
                        const res = await core.sendCDPCommand(tabId, "Runtime.evaluate", { expression: scrollScript, returnByValue: true });
                        if (res.result?.value) return `SUCCESS: Scrolled container [${id}] ${direction}.`;
                    }
                }

                await core.sendCDPCommand(tabId, "Runtime.evaluate", {
                    expression: `window.scrollBy({ top: ${dy}, behavior: 'smooth' })`
                });
                return `SUCCESS: Scrolled window ${direction}.`;
            }

            default: return `Unknown tool: ${toolName}`;
        }
    } catch (e: any) {
        setError(e.message);
        return `Error: ${e.message}`;
    }
}

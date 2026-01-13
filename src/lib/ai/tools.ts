/**
 * Tools Definition & Execution Logic
 * 包含了工具的 Schema 定义和在 Content Script 中执行的具体逻辑。
 */

// 1. 定义工具 Schema
export const TOOLS = [
    {
        type: "function",
        function: {
            name: "get_page_structure",
            description: "Get the semantic structure of the current web page, including interactive elements (buttons, links, inputs) with their unique 'ai-id'. returns a Markdown-like tree. Use this to find Element IDs.",
            parameters: { type: "object", properties: {}, required: [] }
        }
    },
    {
        type: "function",
        function: {
            name: "click_element",
            description: "Click on an element using its 'ai-id' found from get_page_structure. MUST use 'ai-xxxxx' format.",
            parameters: {
                type: "object",
                properties: {
                    elementId: { type: "string", description: "The unique ID (e.g., 'ai-ab12') of the element to click." }
                },
                required: ["elementId"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "scroll_page",
            description: "Scroll the page up or down.",
            parameters: {
                type: "object",
                properties: {
                    direction: { type: "string", enum: ["up", "down"], description: "Direction to scroll" },
                    amount: { type: "number", description: "Pixels to scroll (default 800)" }
                },
                required: ["direction"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "capture_page_screenshot",
            description: "Capture a visible tab screenshot to understand the visual layout.",
            parameters: { type: "object", properties: {}, required: [] }
        }
    },
    {
        type: "function",
        function: {
            name: "get_visible_text",
            description: "Get the raw visible text content of the page for reading articles or intent analysis.",
            parameters: { type: "object", properties: {}, required: [] }
        }
    },
    {
        type: "function",
        function: {
            name: "set_task_plan",
            description: "Set or update the global task plan. Call this immediately after understanding the User Objective.",
            parameters: {
                type: "object",
                properties: {
                    type: { type: "string", enum: ["chain", "parallel"], description: "Execution mode" },
                    steps: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                description: { type: "string", description: "Description of the step" },
                                dependsOn: { type: "number", description: "Index of the step it depends on" }
                            },
                            required: ["description"]
                        }
                    }
                },
                required: ["type", "steps"]
            }
        }
    }
];

export const TOOL_NAMES = TOOLS.map((t: any) => t.function.name);

// 2. 工具执行器
export async function executeToolCall(toolName: string, toolArgs: any) {
    // 别名映射
    const aliasMap: Record<string, string> = {
        'click': 'click_element',
        'scroll': 'scroll_page',
        'screenshot': 'capture_page_screenshot',
        'get_structure': 'get_page_structure'
    };
    const finalToolName = aliasMap[toolName] || toolName;

    // 参数归一化
    const args = { ...toolArgs };
    if (finalToolName === 'click_element' && args.id && !args.elementId) {
        args.elementId = args.id;
    }

    if (finalToolName === "set_task_plan") {
        return "Plan Set";
    }

    // Chrome Runtime Helper
    const runInPage = async (fn: Function, args: any[] = []) => {
        // @ts-ignore
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab?.id) return "Error: No active tab found.";

        try {
            // @ts-ignore
            const results = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: fn as any,
                args: args
            });
            return results[0]?.result || "Action executed (no return).";
        } catch (e: any) {
            return `Error executing script: ${e.message}`;
        }
    };

    if (finalToolName === "get_visible_text") {
        return await runInPage(() => {
            return document.body.innerText.slice(0, 5000);
        });
    }

    if (finalToolName === "capture_page_screenshot") {
        try {
            // @ts-ignore
            const dataUrl = await chrome.tabs.captureVisibleTab(chrome.windows.WINDOW_ID_CURRENT, { format: 'jpeg', quality: 60 });
            return `IMAGE_DATA:${dataUrl}`;
        } catch (e: any) {
            return `Error capturing screenshot: ${e.message}. Tip: Check permissions.`;
        }
    }

    if (finalToolName === "get_page_structure") {
        return await runInPage(() => {
            let idCounter = 0;
            const traverse = (node: Element, depth: number = 0): string => {
                const tagName = node.tagName.toLowerCase();
                if (['script', 'style', 'noscript', 'canvas', 'svg', 'path', 'meta', 'link'].includes(tagName)) return "";

                const style = window.getComputedStyle(node);
                if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity) < 0.1) return "";

                const isNativeInteractive = ['button', 'a', 'input', 'select', 'textarea'].includes(tagName);
                const role = node.getAttribute('role');
                const isAriaInteractive = ['button', 'link', 'tab', 'menuitem', 'checkbox', 'switch'].includes(role || '');
                const isCursorPointer = style.cursor === 'pointer';
                const isInteractive = isNativeInteractive || isAriaInteractive || isCursorPointer;

                let directText = "";
                // @ts-ignore
                let childrenHtml = "";

                Array.from(node.childNodes).forEach(child => {
                    if (child.nodeType === Node.TEXT_NODE) {
                        const t = child.textContent?.trim();
                        if (t) directText += t + " ";
                    } else if (child.nodeType === Node.ELEMENT_NODE) {
                        childrenHtml += traverse(child as Element, depth + 1);
                    }
                });

                if (isInteractive) {
                    const existingId = node.getAttribute('data-ai-id');
                    const id = existingId || `ai-${Math.random().toString(36).substr(2, 4)}-${idCounter++}`;
                    if (!existingId) node.setAttribute('data-ai-id', id);

                    const label = (node as HTMLElement).innerText || directText || "";
                    const cleanLabel = label.replace(/\s+/g, ' ').trim().slice(0, 80);

                    return ` [${tagName.toUpperCase()} id="${id}"${role ? ` role="${role}"` : ''}: ${cleanLabel || 'Clickable'}] `;
                }

                if (directText.length > 0) {
                    return `${directText} ${childrenHtml}`;
                }

                return childrenHtml;
            };

            return traverse(document.body).replace(/\s+/g, ' ').trim().slice(0, 15000);
        });
    }

    if (finalToolName === "click_element") {
        return await runInPage((eid: string) => {
            const el = document.querySelector(`[data-ai-id="${eid}"]`) || document.getElementById(eid);
            if (!el) return `Error: Element with ID '${eid}' not found.`;

            const hEl = el as HTMLElement;
            hEl.scrollIntoView({ behavior: 'instant', block: 'center' });

            // 特殊处理：如果是 <a> 标签且有 href，直接导航
            if (hEl.tagName.toLowerCase() === 'a') {
                const href = hEl.getAttribute('href');
                if (href) {
                    // 直接修改 location，绕过事件委托
                    window.location.href = href.startsWith('http') ? href : window.location.origin + href;
                    return `Navigated to ${href}`;
                }
            }

            // 否则，使用完整的事件序列模拟
            hEl.focus?.();

            // 模拟完整的鼠标交互序列
            hEl.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }));
            hEl.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window }));
            hEl.click();
            hEl.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));

            return `Clicked element ${eid}`;
        }, [args.elementId]);
    }

    if (finalToolName === "scroll_page") {
        return await runInPage((dir: string, amt: number) => {
            window.scrollBy({ top: (amt || 800) * (dir === 'down' ? 1 : -1), behavior: 'smooth' });
            return `Scrolled ${dir}.`;
        }, [args.direction, args.amount]);
    }

    return `Error: Tool '${toolName}' not implemented.`;
}

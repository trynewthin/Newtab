/**
 * Vision Agent - 工具逻辑与执行器
 * 采用 Text-First, Vision-Fallback 策略
 */

import type { ToolDefinition, ModelConfig } from '../types';
import * as core from './core';
import { useVisionState } from './state';

// ============================================
// 工具定义 (Tool Definitions)
// ============================================

export const VISION_TOOLS: ToolDefinition[] = [
    {
        type: "function",
        function: {
            name: "navigate_to",
            description: "Navigate to a specific URL in the current tab.",
            parameters: {
                type: "object",
                properties: {
                    url: { type: "string", description: "The destination URL (must include http/https)." }
                },
                required: ["url"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "search_web",
            description: "Search the web using the configured search engine.",
            parameters: {
                type: "object",
                properties: {
                    query: { type: "string", description: "The search query." }
                },
                required: ["query"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "get_accessibility_tree",
            description: "Get a compressed, text-based accessibility tree of the current viewport. Returns a list of interactive elements with unique IDs. Use this as the PRIMARY way to 'see' the page. It's fast and cheap.",
            parameters: { type: "object", properties: {}, required: [] }
        }
    },
    {
        type: "function",
        function: {
            name: "capture_screenshot",
            description: "Capture a screenshot of the current viewport. Use this ONLY when the text-based accessibility tree is insufficient (e.g., for image-heavy content, charts, or icon-only buttons). Returns a base64 image.",
            parameters: { type: "object", properties: {}, required: [] }
        }
    },
    {
        type: "function",
        function: {
            name: "click_by_id",
            description: "Click an interactive element by its [ID] from the accessibility tree.",
            parameters: {
                type: "object",
                properties: { id: { type: "number", description: "The ID of the element to click." } },
                required: ["id"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "type_text",
            description: "Type text into the currently focused input field, or specify an ID to focus first. Optionally press Enter after typing.",
            parameters: {
                type: "object",
                properties: {
                    text: { type: "string", description: "The text to type." },
                    id: { type: "number", description: "Optional: ID of the input element to focus before typing." },
                    press_enter: { type: "boolean", description: "Optional: press Enter after typing." }
                },
                required: ["text"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "scroll",
            description: "Scroll the page. If no ID is provided, it intelligently scrolls the main content area (Window or the largest scrollable container). Specify an ID only if you want to scroll a specific small side-panel.",
            parameters: {
                type: "object",
                properties: {
                    direction: { type: "string", enum: ["up", "down"], description: "Scroll direction." },
                    amount: { type: "number", description: "Pixels to scroll. Default is 500." },
                    id: { type: "number", description: "Optional: ID of a specific scrollable container." }
                },
                required: ["direction"]
            }
        }
    }
];

export const VISION_TOOL_NAMES = VISION_TOOLS.map(t => t.function.name);

// ============================================
// ID 映射存储 (Module-level state)
// ============================================

interface ElementInfo {
    selector: string;
    isScrollable: boolean;
}

let idToElementMap: Map<number, ElementInfo> = new Map();

// ============================================
// 核心 JS 注入脚本
// ============================================

/**
 * 生成可访问性 tree 的 JS 脚本
 */
const GET_ACCESSIBILITY_TREE_SCRIPT = `
(function() {
    const output = [];
    const idData = [];
    let idCounter = 1;
    const stats = { interactive: 0, editable: 0, scrollable: 0 };

    const previousMarks = document.querySelectorAll('[data-webagent-id]');
    previousMarks.forEach(el => el.removeAttribute('data-webagent-id'));

    function isInViewport(rect) {
        return (
            rect.width > 0 && rect.height > 0 &&
            rect.bottom >= 0 && rect.right >= 0 &&
            rect.top <= window.innerHeight && rect.left <= window.innerWidth
        );
    }

    function getUniqueSelector(el) {
        if (el.id) return '#' + CSS.escape(el.id);
        const testId = el.getAttribute('data-testid') || el.getAttribute('data-id');
        if (testId) return '[data-testid="' + testId + '"]';
        const path = [];
        let current = el;
        while (current && current.nodeName !== 'BODY' && current.nodeName !== 'HTML') {
            let selector = current.nodeName.toLowerCase();
            const parent = current.parentElement;
            if (parent) {
                const siblings = Array.from(parent.children).filter(c => c.nodeName === current.nodeName);
                if (siblings.length > 1) {
                    const index = siblings.indexOf(current) + 1;
                    selector += ':nth-of-type(' + index + ')';
                }
            }
            path.unshift(selector);
            current = current.parentElement;
        }
        return path.join(' > ');
    }

    function getAriaLabelledText(el) {
        const ids = (el.getAttribute('aria-labelledby') || '').trim();
        if (!ids) return '';
        return ids.split(/\s+/).map(id => {
            const ref = document.getElementById(id);
            return ref ? ref.innerText.trim() : '';
        }).filter(Boolean).join(' ').trim();
    }

    function getAccessibleName(el) {
        const labelledBy = getAriaLabelledText(el);
        return (
            el.getAttribute('aria-label') ||
            labelledBy ||
            el.getAttribute('aria-placeholder') ||
            el.getAttribute('title') ||
            el.innerText?.trim().slice(0, 40) ||
            el.getAttribute('placeholder') ||
            el.getAttribute('data-placeholder') ||
            el.value ||
            ''
        ).replace(/\s+/g, ' ').trim();
    }

    function getClassLabel(el) {
        const className = (el.getAttribute('class') || '').trim();
        if (!className) return '';
        const compact = className.split(/\s+/).filter(Boolean).slice(0, 3).join('.');
        return compact ? ' {class:' + compact + '}' : '';
    }

    function traverse(node, depth = 0) {
        if (node.nodeType !== Node.ELEMENT_NODE) return;
        const tagName = node.tagName.toLowerCase();
        if (['script', 'style', 'noscript', 'svg', 'path', 'link', 'meta', 'head'].includes(tagName)) return;
        const rect = node.getBoundingClientRect();
        const style = window.getComputedStyle(node);
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return;
        if (rect.width < 5 || rect.height < 5) return;
        const inViewport = isInViewport(rect);
        const className = (node.getAttribute('class') || '').trim();
        const rawRole = node.getAttribute('role') || tagName;
        const inputType = tagName === 'input' ? (node.getAttribute('type') || 'text') : '';
        const roleLabel = tagName === 'input' ? ('input:' + inputType) : rawRole;
        const isScrollable = (node.scrollHeight > node.clientHeight + 10) && 
                           (style.overflowY === 'auto' || style.overflowY === 'scroll');
        const isEditable = node.isContentEditable || rawRole === 'textbox' || rawRole === 'searchbox' || rawRole === 'combobox';
        const hasTabIndex = node.hasAttribute('tabindex') && Number(node.getAttribute('tabindex')) >= 0;
        const hasClickHandler = typeof node.onclick === 'function' || node.hasAttribute('onclick');
        const isInteractive = (
            ['a', 'button', 'input', 'select', 'textarea'].includes(tagName) ||
            node.getAttribute('role') === 'button' ||
            node.getAttribute('role') === 'link' ||
            node.getAttribute('role') === 'tab' ||
            isScrollable ||
            isEditable ||
            hasTabIndex ||
            hasClickHandler
        );
        const isImportantContainer = tagName === 'div' && /chat|message|list|conversation|thread|dialog|input|editor|compose|comment|msg/i.test(className);
        const isSemanticContainer = ['nav', 'main', 'header', 'footer', 'aside', 'section', 'article', 'form', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'label'].includes(tagName) || isImportantContainer;
        const indent = "  ".repeat(depth);
        let line = "";
        if (isInteractive && inViewport) {
            const id = idCounter++;
            const name = getAccessibleName(node);
            const scrollInfo = isScrollable ? ' [scrollable]' : '';
            const editableInfo = isEditable ? ' [editable]' : '';
            const classLabel = getClassLabel(node);
            node.setAttribute('data-webagent-id', String(id));
            line = indent + '[' + id + '] <' + roleLabel + '>' + scrollInfo + editableInfo + ' ' + name + classLabel;
            stats.interactive += 1;
            if (isEditable) stats.editable += 1;
            if (isScrollable) stats.scrollable += 1;
            idData.push({ id, selector: '[data-webagent-id="' + id + '"]', isScrollable });
        } else if (isSemanticContainer && inViewport) {
            const text = node.childNodes.length > 0 ? 
                Array.from(node.childNodes).filter(n => n.nodeType === Node.TEXT_NODE).map(n => n.textContent.trim()).join(' ').slice(0, 30) : '';
            const classLabel = getClassLabel(node);
            if (text || tagName.match(/^h[1-6]$/) || classLabel) line = indent + '<' + tagName + '> ' + text + classLabel;
        }
        if (line) output.push(line);
        const nextDepth = line ? depth + 1 : depth;
        if (inViewport && (tagName === 'iframe' || tagName === 'frame')) {
            let accessed = false;
            try {
                const body = node.contentDocument && node.contentDocument.body;
                if (body) {
                    accessed = true;
                    traverse(body, nextDepth);
                }
            } catch (e) { }
            if (!accessed) {
                const src = node.getAttribute('src') || '';
                output.push(indent + '<iframe> [inaccessible] ' + src.slice(0, 40));
            }
        }
        if (node.shadowRoot) {
            Array.from(node.shadowRoot.children).forEach(child => traverse(child, nextDepth));
        }
        Array.from(node.children).forEach(child => traverse(child, nextDepth));
    }
    traverse(document.body);
    return {
        tree: output.join("\\n"),
        idMap: idData,
        viewport: { width: window.innerWidth, height: window.innerHeight },
        scrollY: window.scrollY,
        totalHeight: document.body.scrollHeight,
        url: window.location.href,
        title: document.title,
        stats
    };
})()
`;

// ============================================
// 工具执行器 (Tool Executor)
// ============================================

export async function executeVisionTool(toolName: string, toolArgs: any, config?: ModelConfig): Promise<any> {
    const tab = await core.getActiveTab();
    if (!tab?.id) return "Error: No active tab found.";
    const tabId = tab.id;
    const { setStatus, setError } = useVisionState.getState();

    try {
        switch (toolName) {
            case "navigate_to": {
                const { url } = toolArgs;
                await chrome.tabs.update(tabId, { url });
                return `SUCCESS: Navigating to ${url}. Please wait for the page to load and then call get_accessibility_tree.`;
            }

            case "search_web": {
                const { query } = toolArgs;
                const engineTemplate = config?.searchEngine || "https://www.google.com/search?q=%s";
                const url = engineTemplate.replace("%s", encodeURIComponent(query));
                await chrome.tabs.update(tabId, { url });
                return `SUCCESS: Searching for "${query}" using ${url}. Please wait for the page to load and then call get_accessibility_tree.`;
            }

            case "get_accessibility_tree": {
                setStatus('capturing');
                await core.attachDebugger(tabId);
                const res = await core.sendCDPCommand(tabId, "Runtime.evaluate", {
                    expression: GET_ACCESSIBILITY_TREE_SCRIPT,
                    returnByValue: true
                });
                const data = res.result?.value;
                if (!data) return "Error: Failed to get accessibility tree.";

                idToElementMap.clear();
                data.idMap.forEach((item: any) => {
                    idToElementMap.set(item.id, {
                        selector: item.selector,
                        isScrollable: item.isScrollable
                    });
                });

                setStatus('success');
                const scrollInfo = `URL: ${data.url}\nTitle: ${data.title}\nViewport: ${data.viewport.width}x${data.viewport.height}, ScrollY: ${data.scrollY}/${data.totalHeight}`;
                const statsInfo = data.stats ? `Interactive: ${data.stats.interactive}, Editable: ${data.stats.editable}, Scrollable: ${data.stats.scrollable}` : '';
                return `== Page Accessibility Tree ==\n${scrollInfo}${statsInfo ? `\n${statsInfo}` : ''}\n---\n${data.tree}\n---\nTotal interactive elements: ${data.idMap.length}`;
            }

            case "capture_screenshot": {
                if (!config) return "Error: Config missing for screenshot.";
                setStatus('capturing');
                const screenshot = await core.captureViewport(tab.windowId);
                setStatus('success');
                return {
                    __type: "vision_screenshot",
                    screenshot: screenshot,
                    message: "Screenshot captured. Analyze it to understand the visual content."
                };
            }

            case "click_by_id": {
                const { id } = toolArgs;
                const elementInfo = idToElementMap.get(id);
                if (!elementInfo) return `Error: ID [${id}] not found. Refresh tree.`;
                await core.attachDebugger(tabId);
                const scrollScript = `(function() { document.querySelector(\`${elementInfo.selector.replace(/`/g, '\\`')}\`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }); return true; })()`;
                await core.sendCDPCommand(tabId, "Runtime.evaluate", { expression: scrollScript, returnByValue: true });
                await new Promise(r => setTimeout(r, 400));
                const resolveScript = `(function() { const r = document.querySelector(\`${elementInfo.selector.replace(/`/g, '\\`')}\`)?.getBoundingClientRect(); return r ? { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) } : null; })()`;
                const res = await core.sendCDPCommand(tabId, "Runtime.evaluate", { expression: resolveScript, returnByValue: true });
                const target = res.result?.value;
                if (!target) return `Error: Element [${id}] disappeared.`;
                const { x, y } = target;
                await core.sendCDPCommand(tabId, "Input.dispatchMouseEvent", { type: "mouseMoved", x, y });
                await core.sendCDPCommand(tabId, "Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 });
                await core.sendCDPCommand(tabId, "Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: 1 });
                await core.sendCDPCommand(tabId, "Runtime.evaluate", { expression: `document.querySelector(\`${elementInfo.selector.replace(/`/g, '\\`')}\`)?.click()` });
                return `SUCCESS: Clicked [${id}] at (${x}, ${y}). Refresh tree to see changes.`;
            }

            case "type_text": {
                const { text, id, press_enter } = toolArgs;
                await core.attachDebugger(tabId);
                if (id !== undefined) {
                    const elementInfo = idToElementMap.get(id);
                    if (elementInfo) {
                        const focusScript = `(function() { const el = document.querySelector(\`${elementInfo.selector.replace(/`/g, '\\`')}\`); if (el) { el.focus(); el.click(); return true; } return false; })()`;
                        await core.sendCDPCommand(tabId, "Runtime.evaluate", { expression: focusScript, returnByValue: true });
                        await new Promise(r => setTimeout(r, 100));
                    }
                }
                for (const char of text) {
                    await core.sendCDPCommand(tabId, "Input.dispatchKeyEvent", { type: "keyDown", text: char });
                    await core.sendCDPCommand(tabId, "Input.dispatchKeyEvent", { type: "keyUp", text: char });
                }
                if (press_enter) {
                    await core.sendCDPCommand(tabId, "Input.dispatchKeyEvent", { type: "keyDown", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 });
                    await core.sendCDPCommand(tabId, "Input.dispatchKeyEvent", { type: "keyUp", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 });
                }
                const enterInfo = press_enter ? ' and pressed Enter' : '';
                return `SUCCESS: Typed "${text}"${id !== undefined ? ` into [${id}]` : ''}${enterInfo}.`;
            }

            case "scroll": {
                const { direction, amount = 500, id } = toolArgs;
                const dy = direction === "down" ? amount : -amount;
                await core.attachDebugger(tabId);

                // 1. Explicit ID Scroll
                if (id !== undefined) {
                    const info = idToElementMap.get(id);
                    if (info?.isScrollable) {
                        const s = `(function() { document.querySelector(\`${info.selector.replace(/`/g, '\\`')}\`)?.scrollBy({ top: ${dy}, behavior: 'smooth' }); return true; })()`;
                        await core.sendCDPCommand(tabId, "Runtime.evaluate", { expression: s, returnByValue: true });
                        return `SUCCESS: Scrolled container [${id}].`;
                    }
                    return "Error: Element not scrollable or not found";
                }

                // 2. Smart Global Scroll
                const smartScrollScript = `
                (function() {
                    const dy = ${dy};
                    
                    // Helper: Check if element is scrollable
                    function isScrollable(el) {
                         const style = window.getComputedStyle(el);
                         return (el.scrollHeight > el.clientHeight) && 
                                (style.overflowY === 'auto' || style.overflowY === 'scroll' || style.overflowY === 'overlay');
                    }
            
                    // 1. Try Window first if body is scrollable
                    // Some sites hide overflow on body but scroll on html, or vice versa.
                    const bodyStyle = window.getComputedStyle(document.body);
                    const htmlStyle = window.getComputedStyle(document.documentElement);
                    const isWindowScrollable = (bodyStyle.overflowY !== 'hidden' && htmlStyle.overflowY !== 'hidden');

                    if (isWindowScrollable && (document.documentElement.scrollHeight > window.innerHeight + 10 || document.body.scrollHeight > window.innerHeight + 10)) {
                         window.scrollBy({ top: dy, behavior: 'smooth' });
                         return "Scrolled Page (Window)";
                    }
            
                    // 2. Find Largest Scrollable Container
                    let maxArea = 0;
                    let target = null;
                    
                    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
                    while(walker.nextNode()) {
                        const el = walker.currentNode;
                        if (isScrollable(el)) {
                            const rect = el.getBoundingClientRect();
                            // Must be visible
                            if (rect.width > 0 && rect.height > 0) {
                                const area = rect.width * rect.height;
                                // Prefer larger areas
                                if (area > maxArea) {
                                    maxArea = area;
                                    target = el;
                                }
                            }
                        }
                    }
            
                    if (target) {
                        target.scrollBy({ top: dy, behavior: 'smooth' });
                         // Return meaningful identifier for feedback
                        let name = target.id ? ('#' + target.id) : ('<' + target.tagName.toLowerCase() + '>');
                        return "Scrolled Container: " + name;
                    }
            
                    return "Failed: No scrollable target found (Window is locked and no scrollable containers).";
                })()
                `;

                const res = await core.sendCDPCommand(tabId, "Runtime.evaluate", {
                    expression: smartScrollScript,
                    returnByValue: true
                });

                return `SUCCESS: ${res.result?.value || 'Scroll command executed'}.`;
            }

            default: return `Error: Unknown tool: ${toolName}`;
        }
    } catch (e: any) {
        setError(e.message);
        return `Error: ${e.message}`;
    }
}

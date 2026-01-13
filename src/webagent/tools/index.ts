/**
 * CDP (Chrome DevTools Protocol) 工具层
 * 使用纯视觉方案 + CDP 进行页面交互
 */

import type { ToolDefinition } from '../types';

// ============================================
// 工具定义 Schema
// ============================================

export const TOOLS: ToolDefinition[] = [
    {
        type: "function",
        function: {
            name: "capture_screenshot",
            description: "Capture a screenshot of the current page. This is your primary way to understand the page visually. The screenshot will be returned as an image for you to analyze.",
            parameters: { type: "object", properties: {}, required: [] }
        }
    },
    {
        type: "function",
        function: {
            name: "click_at",
            description: "Click at a specific screen coordinate (x, y). Use this after analyzing the screenshot to click on buttons, links, or any interactive elements. Coordinates are in pixels from the top-left corner of the viewport.",
            parameters: {
                type: "object",
                properties: {
                    x: { type: "number", description: "X coordinate in pixels from left edge" },
                    y: { type: "number", description: "Y coordinate in pixels from top edge" },
                    clickType: {
                        type: "string",
                        enum: ["left", "right", "double"],
                        description: "Type of click (default: left)"
                    }
                },
                required: ["x", "y"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "type_text",
            description: "Type text at the current cursor position. Use after clicking on an input field.",
            parameters: {
                type: "object",
                properties: {
                    text: { type: "string", description: "Text to type" },
                    pressEnter: { type: "boolean", description: "Whether to press Enter after typing (default: false)" }
                },
                required: ["text"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "scroll",
            description: "Scroll the page in a direction.",
            parameters: {
                type: "object",
                properties: {
                    direction: { type: "string", enum: ["up", "down", "left", "right"], description: "Direction to scroll" },
                    amount: { type: "number", description: "Pixels to scroll (default: 500)" }
                },
                required: ["direction"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "navigate",
            description: "Navigate to a URL.",
            parameters: {
                type: "object",
                properties: {
                    url: { type: "string", description: "The URL to navigate to" }
                },
                required: ["url"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "press_key",
            description: "Press a keyboard key.",
            parameters: {
                type: "object",
                properties: {
                    key: {
                        type: "string",
                        description: "Key to press (e.g., 'Enter', 'Escape', 'Tab', 'Backspace', 'ArrowDown', etc.)"
                    },
                    modifiers: {
                        type: "array",
                        items: { type: "string", enum: ["ctrl", "alt", "shift", "meta"] },
                        description: "Modifier keys to hold"
                    }
                },
                required: ["key"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "wait",
            description: "Wait for a specified time. Use this to wait for page loading or animations.",
            parameters: {
                type: "object",
                properties: {
                    ms: { type: "number", description: "Milliseconds to wait (default: 1000)" }
                },
                required: []
            }
        }
    },
    {
        type: "function",
        function: {
            name: "set_task_plan",
            description: "Set or update the global task plan. Call this immediately after understanding the user's request.",
            parameters: {
                type: "object",
                properties: {
                    type: { type: "string", enum: ["chain", "parallel"], description: "Execution mode" },
                    steps: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                description: { type: "string", description: "Description of the step" }
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

export const TOOL_NAMES = TOOLS.map(t => t.function.name);

// ============================================
// CDP 辅助函数
// ============================================

/** 获取当前活动标签页 */
async function getActiveTab(): Promise<chrome.tabs.Tab | null> {
    // @ts-ignore
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab || null;
}

/** 附加 Debugger 到标签页 */
async function attachDebugger(tabId: number): Promise<boolean> {
    try {
        // @ts-ignore
        await chrome.debugger.attach({ tabId }, "1.3");
        return true;
    } catch (e: any) {
        // 已经附加的情况
        if (e.message?.includes("already attached")) {
            return true;
        }
        console.error("Failed to attach debugger:", e);
        return false;
    }
}

/** 发送 CDP 命令 */
async function sendCDPCommand(tabId: number, method: string, params: any = {}): Promise<any> {
    // @ts-ignore
    return await chrome.debugger.sendCommand({ tabId }, method, params);
}

/** 分离 Debugger */
async function detachDebugger(tabId: number): Promise<void> {
    try {
        // @ts-ignore
        await chrome.debugger.detach({ tabId });
    } catch (e) {
        // 忽略分离错误
    }
}

// ============================================
// 工具执行器
// ============================================

export async function executeToolCall(toolName: string, toolArgs: any): Promise<string> {
    const tab = await getActiveTab();
    if (!tab?.id) {
        return "Error: No active tab found.";
    }

    const tabId = tab.id;

    try {
        switch (toolName) {
            case "capture_screenshot": {
                // 使用 Chrome API 截图
                // @ts-ignore
                const dataUrl = await chrome.tabs.captureVisibleTab(
                    chrome.windows.WINDOW_ID_CURRENT,
                    { format: 'png' }
                );
                return `IMAGE_DATA:${dataUrl}`;
            }

            case "click_at": {
                const x = toolArgs.x || 0;
                const y = toolArgs.y || 0;
                const clickType = toolArgs.clickType || "left";

                const attached = await attachDebugger(tabId);
                if (!attached) {
                    return "Error: Failed to attach debugger. Check permissions.";
                }

                try {
                    // 模拟鼠标移动
                    await sendCDPCommand(tabId, "Input.dispatchMouseEvent", {
                        type: "mouseMoved",
                        x,
                        y
                    });

                    // 根据点击类型执行
                    const button = clickType === "right" ? "right" : "left";
                    const clickCount = clickType === "double" ? 2 : 1;

                    // Mouse down
                    await sendCDPCommand(tabId, "Input.dispatchMouseEvent", {
                        type: "mousePressed",
                        x,
                        y,
                        button,
                        clickCount
                    });

                    // Mouse up
                    await sendCDPCommand(tabId, "Input.dispatchMouseEvent", {
                        type: "mouseReleased",
                        x,
                        y,
                        button,
                        clickCount
                    });

                    return `Clicked at (${x}, ${y}) with ${clickType} click.`;
                } finally {
                    // 不立即分离，保持连接以便后续操作
                }
            }

            case "type_text": {
                const text = toolArgs.text || "";
                const pressEnter = toolArgs.pressEnter || false;

                const attached = await attachDebugger(tabId);
                if (!attached) {
                    return "Error: Failed to attach debugger.";
                }

                try {
                    // 逐字符输入
                    for (const char of text) {
                        await sendCDPCommand(tabId, "Input.dispatchKeyEvent", {
                            type: "char",
                            text: char
                        });
                    }

                    if (pressEnter) {
                        await sendCDPCommand(tabId, "Input.dispatchKeyEvent", {
                            type: "keyDown",
                            key: "Enter",
                            code: "Enter",
                            windowsVirtualKeyCode: 13,
                            nativeVirtualKeyCode: 13
                        });
                        await sendCDPCommand(tabId, "Input.dispatchKeyEvent", {
                            type: "keyUp",
                            key: "Enter",
                            code: "Enter",
                            windowsVirtualKeyCode: 13,
                            nativeVirtualKeyCode: 13
                        });
                    }

                    return `Typed: "${text}"${pressEnter ? " + Enter" : ""}`;
                } finally {
                    // 保持连接
                }
            }

            case "scroll": {
                const direction = toolArgs.direction || "down";
                const amount = toolArgs.amount || 500;

                const attached = await attachDebugger(tabId);
                if (!attached) {
                    return "Error: Failed to attach debugger.";
                }

                try {
                    let deltaX = 0;
                    let deltaY = 0;

                    switch (direction) {
                        case "up": deltaY = -amount; break;
                        case "down": deltaY = amount; break;
                        case "left": deltaX = -amount; break;
                        case "right": deltaX = amount; break;
                    }

                    // 获取视口中心点
                    const viewportWidth = tab.width || 1280;
                    const viewportHeight = tab.height || 720;

                    await sendCDPCommand(tabId, "Input.dispatchMouseEvent", {
                        type: "mouseWheel",
                        x: viewportWidth / 2,
                        y: viewportHeight / 2,
                        deltaX,
                        deltaY
                    });

                    return `Scrolled ${direction} by ${amount}px.`;
                } finally {
                    // 保持连接
                }
            }

            case "navigate": {
                const url = toolArgs.url || "";
                if (!url) {
                    return "Error: No URL provided.";
                }

                // @ts-ignore
                await chrome.tabs.update(tabId, { url });

                // 等待页面加载
                await new Promise(resolve => setTimeout(resolve, 2000));

                return `Navigated to: ${url}`;
            }

            case "press_key": {
                const key = toolArgs.key || "";
                const modifiers = toolArgs.modifiers || [];

                if (!key) {
                    return "Error: No key specified.";
                }

                const attached = await attachDebugger(tabId);
                if (!attached) {
                    return "Error: Failed to attach debugger.";
                }

                try {
                    // 构建修饰键状态
                    let modifierFlags = 0;
                    if (modifiers.includes("alt")) modifierFlags |= 1;
                    if (modifiers.includes("ctrl")) modifierFlags |= 2;
                    if (modifiers.includes("meta")) modifierFlags |= 4;
                    if (modifiers.includes("shift")) modifierFlags |= 8;

                    // Key down
                    await sendCDPCommand(tabId, "Input.dispatchKeyEvent", {
                        type: "keyDown",
                        key,
                        modifiers: modifierFlags
                    });

                    // Key up
                    await sendCDPCommand(tabId, "Input.dispatchKeyEvent", {
                        type: "keyUp",
                        key,
                        modifiers: modifierFlags
                    });

                    return `Pressed key: ${modifiers.length ? modifiers.join("+") + "+" : ""}${key}`;
                } finally {
                    // 保持连接
                }
            }

            case "wait": {
                const ms = toolArgs.ms || 1000;
                await new Promise(resolve => setTimeout(resolve, ms));
                return `Waited ${ms}ms.`;
            }

            case "set_task_plan": {
                // 任务计划由 Hook 层处理
                return "Plan set.";
            }

            default:
                return `Error: Unknown tool "${toolName}".`;
        }
    } catch (error: any) {
        console.error(`Tool ${toolName} error:`, error);
        return `Error executing ${toolName}: ${error.message}`;
    }
}

// ============================================
// 清理函数
// ============================================

/** 清理所有 Debugger 连接 */
export async function cleanupDebugger(): Promise<void> {
    try {
        // @ts-ignore
        const targets = await chrome.debugger.getTargets();
        for (const target of targets) {
            if (target.attached && target.tabId) {
                await detachDebugger(target.tabId);
            }
        }
    } catch (e) {
        // 忽略清理错误
    }
}

import type { Message } from './types';
import { getTextContent } from './types';

/**
 * 准备发送给 API 的消息格式
 * 特点：支持处理 Web Agent 返回的复杂结果 (包含截图和视觉数据)
 */
export function prepareApiMessages(
    history: Message[],
    systemPrompt: string,
    _options: { maxScreenshots?: number } = {}
): any[] {
    const messages: any[] = [{ role: 'system', content: systemPrompt }];

    for (let i = 0; i < history.length; i++) {
        const msg = history[i];

        // 过滤空消息
        if (msg.role === 'assistant' && !msg.content && (!msg.tool_calls || msg.tool_calls.length === 0)) {
            continue;
        }

        const apiMsg: any = { role: msg.role };

        if (msg.role === 'tool') {
            apiMsg.tool_call_id = msg.tool_call_id;
            apiMsg.name = msg.tool_name || 'unknown';

            const rawContent = msg.content;

            // 🔥 处理新的 capture_screenshot 工具返回
            if (rawContent && typeof rawContent === 'object' && rawContent.__type === 'vision_screenshot') {
                // 返回简单文本给 tool
                apiMsg.content = rawContent.message;
                messages.push(apiMsg);

                // 🔥 插入截图作为用户消息，让模型能"看到"
                messages.push({
                    role: 'user',
                    content: [
                        { type: 'text', text: `[SYSTEM] Here is the screenshot from capture_screenshot. Analyze it to understand the page visually.` },
                        { type: 'image_url', image_url: { url: rawContent.screenshot, detail: 'auto' } }
                    ]
                });
                continue;
            }
            // 兼容旧的 vision_result 类型 (已废弃，保留向后兼容)
            else if (rawContent && typeof rawContent === 'object' && rawContent.__type === 'vision_result') {
                apiMsg.content = rawContent.finalResult;
                messages.push(apiMsg);

                messages.push({
                    role: 'user',
                    content: [
                        { type: 'text', text: `[SYSTEM] This is the screenshot captured for ${msg.tool_name}. Look at it to verify the analysis above.` },
                        { type: 'image_url', image_url: { url: rawContent.input.screenshot, detail: 'auto' } }
                    ]
                });
                continue;
            } else {
                apiMsg.content = typeof rawContent === 'string' ? rawContent : getTextContent(rawContent);
            }
        }
        else if (msg.role === 'assistant') {
            apiMsg.content = typeof msg.content === 'string' ? msg.content : getTextContent(msg.content);
            if (msg.tool_calls?.length) apiMsg.tool_calls = msg.tool_calls;
        }
        else if (msg.role === 'user') {
            apiMsg.content = msg.content;
        }
        else {
            apiMsg.content = typeof msg.content === 'string' ? msg.content : getTextContent(msg.content);
        }

        messages.push(apiMsg);
    }

    // 合并连续同角色消息
    const consolidated: any[] = [];
    for (const msg of messages) {
        if (consolidated.length === 0) {
            consolidated.push(msg);
            continue;
        }
        const lastMsg = consolidated[consolidated.length - 1];
        if (lastMsg.role === msg.role && msg.role === 'user') {
            const lastContent = Array.isArray(lastMsg.content) ? lastMsg.content : [{ type: 'text', text: lastMsg.content }];
            const newContent = Array.isArray(msg.content) ? msg.content : [{ type: 'text', text: msg.content }];
            lastMsg.content = [...lastContent, ...newContent];
        } else {
            consolidated.push(msg);
        }
    }

    return consolidated;
}

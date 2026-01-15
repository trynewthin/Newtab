import type { Message } from './types';
import { getTextContent } from './types';

/**
 * 准备发送给 API 的消息格式
 * 特点：支持处理视觉代理返回的复杂结果 (包含文字地图和截图)
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

            // 🔥 核心识别：处理视觉代理的结果
            const rawContent = msg.content;
            if (rawContent && typeof rawContent === 'object' && rawContent.__type === 'vision_result') {
                // 将视觉模型分析出的文本地图作为工具回执
                apiMsg.content = rawContent.finalResult;
                messages.push(apiMsg);

                // 🔥 感官同步：插入一张隐藏的 user 消息，让主模型也能“亲眼看见”这张图
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

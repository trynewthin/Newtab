import type { Message } from './types';
import { getTextContent } from './types';

/**
 * 鍑嗗鍙戦€佺粰 API 鐨勬秷鎭牸寮?
 * 鐗圭偣锛氭敮鎸佸鐞嗚瑙変唬鐞嗚繑鍥炵殑澶嶆潅缁撴灉 (鍖呭惈鏂囧瓧鍦板浘鍜屾埅鍥?
 */
export function prepareApiMessages(
    history: Message[],
    systemPrompt: string,
    _options: { maxScreenshots?: number } = {}
): any[] {
    const messages: any[] = [{ role: 'system', content: systemPrompt }];

    for (let i = 0; i < history.length; i++) {
        const msg = history[i];

        // 杩囨护绌烘秷鎭?
        if (msg.role === 'assistant' && !msg.content && (!msg.tool_calls || msg.tool_calls.length === 0)) {
            continue;
        }

        const apiMsg: any = { role: msg.role };

        if (msg.role === 'tool') {
            apiMsg.tool_call_id = msg.tool_call_id;
            apiMsg.name = msg.tool_name || 'unknown';

            // 馃敟 鏍稿績璇嗗埆锛氬鐞嗚瑙変唬鐞嗙殑缁撴灉
            const rawContent = msg.content;
            if (rawContent && typeof rawContent === 'object' && rawContent.__type === 'vision_result') {
                // 灏嗚瑙夋ā鍨嬪垎鏋愬嚭鐨勬枃鏈湴鍥句綔涓哄伐鍏峰洖鎵?
                apiMsg.content = rawContent.finalResult;
                messages.push(apiMsg);

                // 馃敟 鎰熷畼鍚屾锛氭彃鍏ヤ竴寮犻殣钘忕殑 user 娑堟伅锛岃涓绘ā鍨嬩篃鑳解€滀翰鐪肩湅瑙佲€濊繖寮犲浘
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

    // 鍚堝苟杩炵画鍚岃鑹叉秷鎭?
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

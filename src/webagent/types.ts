/**
 * Web Agent 核心类型定义
 * 多模态消息、任务计划、模型配置等核心数据结构
 */

// ============================================
// 多模态内容类型
// ============================================

/** 文本内容 */
export interface TextContent {
    type: 'text';
    text: string;
}

/** 图像内容 */
export interface ImageContent {
    type: 'image_url';
    image_url: {
        url: string; // base64 data URL 或 http URL
        detail?: 'low' | 'high' | 'auto';
    };
}

/** 多模态内容联合类型 */
export type MessageContent = TextContent | ImageContent;

// ============================================
// 消息类型
// ============================================

export interface Message {
    id?: string;
    role: 'user' | 'assistant' | 'system' | 'tool';
    /** 
     * 内容可以是:
     * - string: 纯文本消息
     * - MessageContent[]: 多模态消息 (文本+图片混合)
     */
    content: string | MessageContent[] | any; // 增加 any 兼容性防御
    timestamp: number;
    tool_calls?: ToolCall[];
    tool_call_id?: string;
    tool_name?: string;
    plan?: TaskPlan;
    stepSummary?: string;
    isIntermediate?: boolean;
    isSummary?: boolean;
}

export interface ToolCall {
    id: string;
    type: 'function';
    function: {
        name: string;
        arguments: string;
    };
}

// ============================================
// 任务计划
// ============================================

export interface TaskStep {
    description: string;
    dependsOn?: number;
}

export interface TaskPlan {
    type: 'chain' | 'parallel';
    steps: TaskStep[];
    currentIndex: number;
}

// ============================================
// 模型配置
// ============================================

export interface ModelConfig {
    id: string;
    name: string;
    apiKey: string;
    baseUrl: string;
    model: string;
    systemPrompt?: string;
    temperature?: number;
}

// ============================================
// 会话管理
// ============================================

export interface ChatSession {
    id: string;
    title: string;
    messages: Message[];
    updatedAt: number;
}

// ============================================
// CDP 相关类型
// ============================================

/** 屏幕坐标 */
export interface ScreenPoint {
    x: number;
    y: number;
}

/** CDP 操作结果 */
export interface CDPResult {
    success: boolean;
    message: string;
    data?: any;
}

// ============================================
// 工具类型
// ============================================

export interface ToolDefinition {
    type: 'function';
    function: {
        name: string;
        description: string;
        parameters: {
            type: 'object';
            properties: Record<string, any>;
            required: string[];
        };
    };
}

// ============================================
// 辅助函数
// ============================================

/** 判断内容是否为多模态 */
export function isMultimodalContent(content: any): content is MessageContent[] {
    return Array.isArray(content);
}

/** 提取消息的纯文本内容 - 增强鲁棒性 */
export function getTextContent(content: any): string {
    if (!content) return "";
    if (typeof content === 'string') return content;

    // 如果是数组
    if (Array.isArray(content)) {
        return content
            .filter((c): c is TextContent => c && typeof c === 'object' && c.type === 'text')
            .map(c => c.text)
            .join('\n');
    }

    // 如果是单个对象
    if (typeof content === 'object') {
        if (content.type === 'text') return content.text || "";
        if (content.text) return content.text; // 兼容没有 type 的情况
    }

    return "";
}

/** 构建多模态消息内容 */
export function buildMultimodalContent(text: string, imageUrls: string[] = []): MessageContent[] {
    const content: MessageContent[] = [];

    if (text) {
        content.push({ type: 'text', text });
    }

    imageUrls.forEach(url => {
        content.push({
            type: 'image_url',
            image_url: { url, detail: 'high' }
        });
    });

    return content;
}

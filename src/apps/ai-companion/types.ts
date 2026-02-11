/**
 * Web Agent 核心类型定义
 */

export interface TextContent {
    type: 'text';
    text: string;
}

export interface ImageContent {
    type: 'image_url';
    image_url: {
        url: string;
        detail?: 'low' | 'high' | 'auto';
    };
}

export type MessageContent = TextContent | ImageContent;

export interface VisionScreenshot {
    __type: 'vision_screenshot';
    message: string;
    screenshot: string;
}

export interface VisionResult {
    __type: 'vision_result';
    finalResult: string;
    input: { screenshot: string };
}

export type ComplexContent = VisionScreenshot | VisionResult | Record<string, unknown>;

export interface Message {
    id?: string;
    role: 'user' | 'assistant' | 'system' | 'tool';
    content: string | MessageContent[] | ComplexContent;
    timestamp: number;
    tool_calls?: ToolCall[];
    tool_call_id?: string;
    tool_name?: string;
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
// 模型与工具配置
// ============================================

export interface ModelConfig {
    id: string;
    name: string;
    apiKey: string;
    baseUrl: string;
    model: string;
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
    searchEngine?: string; // 🔥 搜索引擎配置，例如：https://www.google.com/search?q=%s

    // 🔥 工具箱总开关与子开关
    visionEnabled: boolean; // 总开关：是否启用网页代理功能
    enabledTools: string[]; // 子开关：具体开启哪些工具
}

export interface ChatSession {
    id: string;
    title: string;
    messages: Message[];
    updatedAt: number;
}

export interface ScreenPoint {
    x: number;
    y: number;
}

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

export function isMultimodalContent(content: any): content is MessageContent[] {
    return Array.isArray(content);
}

export function getTextContent(content: any): string {
    if (!content) return "";
    if (typeof content === 'string') return content;
    if (Array.isArray(content)) {
        return content
            .filter((c): c is TextContent => c && typeof c === 'object' && c.type === 'text')
            .map(c => c.text)
            .join('\n');
    }
    return "";
}

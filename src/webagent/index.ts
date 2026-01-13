/**
 * Web Agent 模块统一导出
 * 
 * 视觉优先的 Web Agent 实现
 * - 使用截图进行页面理解
 * - 使用 Chrome DevTools Protocol (CDP) 进行精确坐标操作
 * - 支持多模态消息 (文本 + 图像)
 */

// 类型导出
export * from './types';

// Store 导出
export { useAiStore } from './store';

// Hook 导出
export { useAiChat } from './hooks/useAiChat';

// 工具导出
export { TOOLS, TOOL_NAMES, executeToolCall, cleanupDebugger } from './tools';

/**
 * 系统级 AI 工具集
 */

import type { ToolDefinition } from '../types';

export const SYSTEM_TOOLS: ToolDefinition[] = [];

export async function executeSystemTool(toolName: string, _toolArgs: any): Promise<any> {
    return `Unknown system tool: ${toolName}`;
}

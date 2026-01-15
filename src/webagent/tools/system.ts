/**
 * 系统级 AI 工具集 (获取时间、日期等)
 */

import type { ToolDefinition } from '../types';

export const SYSTEM_TOOLS: ToolDefinition[] = [
    {
        type: "function",
        function: {
            name: "get_time",
            description: "Get the current local time and date. Use this whenever the user asks about the time or date.",
            parameters: { type: "object", properties: {}, required: [] }
        }
    }
];

export async function executeSystemTool(toolName: string, _toolArgs: any): Promise<any> {
    switch (toolName) {
        case "get_time": {
            const now = new Date();
            return {
                local_time: now.toLocaleString(),
                iso_time: now.toISOString(),
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                day_of_week: now.toLocaleDateString(undefined, { weekday: 'long' })
            };
        }
        default:
            return `Unknown system tool: ${toolName}`;
    }
}

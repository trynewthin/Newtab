/**
 * 任务计划工具 - Store + Tool Definitions + Executor
 */

import { create } from 'zustand';
import type { ToolDefinition } from '../types';

// ============================================
// Plan Store
// ============================================

export interface PlanStep {
    id: number;
    text: string;
    status: 'pending' | 'active' | 'done';
}

interface PlanState {
    steps: PlanStep[];
    title: string;
    isComplete: boolean;
    createPlan: (title: string, steps: string[]) => void;
    completeStep: (stepId: number) => void;
    addStep: (text: string, afterStepId?: number) => void;
    reset: () => void;
}

export const usePlanStore = create<PlanState>()((set) => ({
    steps: [],
    title: '',
    isComplete: false,

    createPlan: (title, steps) => set({
        title,
        isComplete: false,
        steps: steps.map((text, i) => ({
            id: i + 1,
            text,
            status: i === 0 ? 'active' as const : 'pending' as const,
        })),
    }),

    completeStep: (stepId) => set((state) => {
        const newSteps = state.steps.map(s => {
            if (s.id === stepId) return { ...s, status: 'done' as const };
            return s;
        });
        // Auto-activate next pending step
        const firstPending = newSteps.find(s => s.status === 'pending');
        if (firstPending) {
            firstPending.status = 'active';
        }
        const allDone = newSteps.every(s => s.status === 'done');
        return { steps: newSteps, isComplete: allDone };
    }),

    addStep: (text, afterStepId) => set((state) => {
        const maxId = state.steps.reduce((max, s) => Math.max(max, s.id), 0);
        const newStep: PlanStep = { id: maxId + 1, text, status: 'pending' };
        if (afterStepId !== undefined) {
            const idx = state.steps.findIndex(s => s.id === afterStepId);
            if (idx !== -1) {
                const newSteps = [...state.steps];
                newSteps.splice(idx + 1, 0, newStep);
                return { steps: newSteps };
            }
        }
        return { steps: [...state.steps, newStep] };
    }),

    reset: () => set({ steps: [], title: '', isComplete: false }),
}));

// ============================================
// Tool Definitions
// ============================================

export const PLAN_TOOLS: ToolDefinition[] = [
    {
        type: 'function',
        function: {
            name: 'create_plan',
            description: 'Create a task plan with ordered steps. Must be called at the beginning of any multi-step task.',
            parameters: {
                type: 'object',
                properties: {
                    title: { type: 'string', description: 'Short title for the plan.' },
                    steps: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Ordered list of step descriptions.',
                    },
                },
                required: ['title', 'steps'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'complete_step',
            description: 'Mark a plan step as completed. The next pending step will automatically become active.',
            parameters: {
                type: 'object',
                properties: {
                    step_id: { type: 'number', description: 'The ID of the step to mark as done.' },
                },
                required: ['step_id'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'get_plan',
            description: 'Get the current plan status with all steps and their states.',
            parameters: { type: 'object', properties: {}, required: [] },
        },
    },
    {
        type: 'function',
        function: {
            name: 'add_step',
            description: 'Add a new step to the plan, optionally after a specific step.',
            parameters: {
                type: 'object',
                properties: {
                    text: { type: 'string', description: 'Description of the new step.' },
                    after_step_id: { type: 'number', description: 'Optional: insert after this step ID.' },
                },
                required: ['text'],
            },
        },
    },
];

export const PLAN_TOOL_NAMES = PLAN_TOOLS.map(t => t.function.name);

// ============================================
// Tool Executor
// ============================================

export function executePlanTool(toolName: string, toolArgs: any): string {
    const store = usePlanStore.getState();

    switch (toolName) {
        case 'create_plan': {
            const { title, steps } = toolArgs;
            if (!steps?.length) return 'Error: steps array is required.';
            store.createPlan(title || 'Task', steps);
            const { steps: created } = usePlanStore.getState();
            return `Plan created: "${title}" with ${created.length} steps.\n` +
                created.map(s => `  ${s.id}. [${s.status === 'active' ? '>' : ' '}] ${s.text}`).join('\n');
        }

        case 'complete_step': {
            const { step_id } = toolArgs;
            const step = store.steps.find(s => s.id === step_id);
            if (!step) return `Error: Step ${step_id} not found.`;
            store.completeStep(step_id);
            const { steps, isComplete } = usePlanStore.getState();
            const status = steps.map(s =>
                `  ${s.id}. [${s.status === 'done' ? 'x' : s.status === 'active' ? '>' : ' '}] ${s.text}`
            ).join('\n');
            return `Step ${step_id} completed.${isComplete ? ' [PLAN_COMPLETE]' : ''}\n${status}`;
        }

        case 'get_plan': {
            const { steps, title, isComplete } = store;
            if (steps.length === 0) return 'No active plan.';
            const status = steps.map(s =>
                `  ${s.id}. [${s.status === 'done' ? 'x' : s.status === 'active' ? '>' : ' '}] ${s.text}`
            ).join('\n');
            return `Plan: "${title}" ${isComplete ? '(COMPLETE)' : ''}\n${status}`;
        }

        case 'add_step': {
            const { text, after_step_id } = toolArgs;
            store.addStep(text, after_step_id);
            const { steps } = usePlanStore.getState();
            const newStep = steps.find(s => s.text === text);
            return `Step ${newStep?.id} added: "${text}"\nTotal steps: ${steps.length}`;
        }

        default:
            return `Error: Unknown plan tool: ${toolName}`;
    }
}

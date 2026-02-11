import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createPersistConfig } from '@/platform/state/core/storage';
import type { Todo } from '@/platform/state/core/types';

interface TodoState {
    todos: Todo[];

    addTodo: (text: string, date?: string) => void;
    toggleTodo: (id: string) => void;
    removeTodo: (id: string) => void;
    clearCompleted: () => void;
    setTodos: (todos: Todo[]) => void;
}

export const useTodoStore = create<TodoState>()(
    persist(
        (set) => ({
            todos: [],

            addTodo: (text: string, date?: string) => set((state: TodoState) => {
                // Default to today if date is not provided
                let targetDate = date;
                if (!targetDate) {
                    const d = new Date();
                    const year = d.getFullYear();
                    const month = String(d.getMonth() + 1).padStart(2, '0');
                    const day = String(d.getDate()).padStart(2, '0');
                    targetDate = `${year}-${month}-${day}`;
                }

                return {
                    todos: [
                        ...state.todos,
                        {
                            id: crypto.randomUUID(),
                            text,
                            completed: false,
                            createdAt: Date.now(),
                            date: targetDate,
                        },
                    ],
                };
            }),

            toggleTodo: (id: string) => set((state: TodoState) => ({
                todos: state.todos.map((todo: Todo) =>
                    todo.id === id ? { ...todo, completed: !todo.completed } : todo
                ),
            })),

            removeTodo: (id: string) => set((state: TodoState) => ({
                todos: state.todos.filter((todo: Todo) => todo.id !== id),
            })),

            clearCompleted: () => set((state: TodoState) => ({
                todos: state.todos.filter((todo: Todo) => !todo.completed),
            })),

            setTodos: (todos: Todo[]) => set({ todos }),
        }),
        createPersistConfig('app-todos')
    )
);


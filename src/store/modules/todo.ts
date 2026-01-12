import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createPersistConfig } from '../core/storage';
import { type Todo } from '../core/types';

interface TodoState {
    todos: Todo[];

    addTodo: (text: string) => void;
    toggleTodo: (id: string) => void;
    removeTodo: (id: string) => void;
    clearCompleted: () => void;
    setTodos: (todos: Todo[]) => void;
}

export const useTodoStore = create<TodoState>()(
    persist(
        (set) => ({
            todos: [],

            addTodo: (text) => set((state) => ({
                todos: [
                    ...state.todos,
                    {
                        id: crypto.randomUUID(),
                        text,
                        completed: false,
                        createdAt: Date.now(),
                    },
                ],
            })),

            toggleTodo: (id) => set((state) => ({
                todos: state.todos.map((todo) =>
                    todo.id === id ? { ...todo, completed: !todo.completed } : todo
                ),
            })),

            removeTodo: (id) => set((state) => ({
                todos: state.todos.filter((todo) => todo.id !== id),
            })),

            clearCompleted: () => set((state) => ({
                todos: state.todos.filter((todo) => !todo.completed),
            })),

            setTodos: (todos) => set({ todos }),
        }),
        createPersistConfig('app-todos')
    )
);

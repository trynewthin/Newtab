import type { StateCreator } from 'zustand';
import type { TodoState, AppState } from '../types';

export const createTodoSlice: StateCreator<
    AppState,
    [],
    [],
    TodoState
> = (set) => ({
    todos: [],
    addTodo: (text) => set((state) => ({
        todos: [
            {
                id: crypto.randomUUID(),
                text,
                completed: false,
                createdAt: Date.now(),
            },
            ...state.todos,
        ]
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
});

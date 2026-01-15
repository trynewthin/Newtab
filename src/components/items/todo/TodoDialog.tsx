import React, { useState } from "react";
import { BaseModal } from "@/components/base/modal/Modal";
import { Input } from "@/components/ui/input";
import { useTodoStore } from "@/store/modules/todo";
import { cn } from "@/lib/utils";
import { Trash2, Plus, Check, X, ChevronUp, ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";


interface TodoDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function TodoDialog({ open, onOpenChange }: TodoDialogProps) {
    const { t } = useTranslation();
    const todos = useTodoStore((s) => s.todos);
    const addTodo = useTodoStore((s) => s.addTodo);
    const toggleTodo = useTodoStore((s) => s.toggleTodo);
    const removeTodo = useTodoStore((s) => s.removeTodo);
    const setTodos = useTodoStore((s) => s.setTodos);

    const [inputValue, setInputValue] = useState("");

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim()) return;

        addTodo(inputValue.trim());
        setInputValue("");
    };

    const moveUp = (index: number) => {
        if (index === 0) return;
        const newTodos = [...todos];
        [newTodos[index - 1], newTodos[index]] = [newTodos[index], newTodos[index - 1]];
        setTodos(newTodos);
    };

    const moveDown = (index: number) => {
        if (index === todos.length - 1) return;
        const newTodos = [...todos];
        [newTodos[index], newTodos[index + 1]] = [newTodos[index + 1], newTodos[index]];
        setTodos(newTodos);
    };

    const overlayContent = (
        <>
            {/* Top: Input Bar */}
            <div className="absolute top-0 left-0 right-0 z-20 w-full flex items-center px-6 py-5 pointer-events-auto bg-linear-to-b from-white/30 to-transparent">
                <form onSubmit={handleAdd} className="flex-1 flex gap-3 items-center min-w-0 group/form">
                    <button
                        type="submit"
                        disabled={!inputValue.trim()}
                        className="h-9 w-9 flex items-center justify-center rounded-xl bg-zinc-900 text-white shadow-sm hover:bg-black disabled:opacity-20 disabled:grayscale transition-all shrink-0"
                    >
                        <Plus size={18} strokeWidth={3} />
                    </button>
                    <div className="flex-1 relative">
                        <Input
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder={t('add_task_placeholder')}
                            className="w-full bg-transparent border-none focus-visible:ring-0 text-base font-bold placeholder:text-zinc-400 h-10 p-0 text-zinc-800"
                            autoFocus
                        />
                        <div className="absolute bottom-1.5 left-0 right-0 h-[2.5px] bg-rose-500/80 transform scale-x-100 transition-transform origin-left" />
                    </div>
                    {/* Close Button */}
                    <button
                        type="button"
                        onClick={() => onOpenChange(false)}
                        className="h-9 w-9 flex items-center justify-center rounded-xl text-black/50 hover:bg-black/5 hover:text-black transition-all shrink-0"
                    >
                        <X size={20} strokeWidth={2.5} />
                    </button>
                </form>
            </div>
        </>
    );

    return (
        <BaseModal
            open={open}
            onOpenChange={onOpenChange}
            header={overlayContent}
            background={
                <div className="absolute inset-0 bg-[#fffdf5] dark:bg-zinc-900">
                    <div className="absolute inset-0 pointer-events-none"
                        style={{
                            backgroundImage: 'linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)',
                            backgroundSize: '24px 24px'
                        }}
                    />
                </div>
            }
            scrollable={false}
        >
            <div className="relative h-full flex flex-col">
                <div className="relative z-10 flex flex-col h-full">
                    <div className="flex-1 overflow-y-auto px-6 pt-20 custom-scrollbar">
                        {/* Todo List */}
                        <div className="space-y-0 text-zinc-800 pb-20">
                            {todos.length === 0 ? (
                                <div className="text-center py-24 text-zinc-300 italic font-serif">
                                    {t('no_tasks')}
                                </div>
                            ) : (
                                todos.map((todo, index) => (
                                    <div
                                        key={todo.id}
                                        className={cn(
                                            "group relative flex items-center gap-3 min-h-[48px] border-b border-black/3 last:border-0 transition-all px-2",
                                            todo.completed && "opacity-60"
                                        )}
                                    >
                                        {/* Checkbox (Ink style) - ml-1.5 to align center with top button */}
                                        <button
                                            onClick={() => toggleTodo(todo.id)}
                                            className={cn(
                                                "shrink-0 h-6 w-6 rounded-lg border-2 transition-all flex items-center justify-center rotate-1 ml-1.5",
                                                todo.completed
                                                    ? "bg-zinc-900 border-zinc-900 scale-90"
                                                    : "border-black/10 bg-white/40 hover:border-black/20"
                                            )}
                                        >
                                            {todo.completed && <Check size={14} className="text-white" strokeWidth={3} />}
                                        </button>

                                        {/* Text with animated underline - Locked to text width */}
                                        <div className="flex-1 pt-0.5 min-w-0">
                                            <span
                                                className={cn(
                                                    "text-[15px] font-medium leading-relaxed break-all",
                                                    "bg-linear-to-r from-rose-500 to-rose-500 bg-size-[0%_1.5px] bg-no-repeat bg-bottom-left group-hover:bg-size-[100%_1.5px] transition-all duration-300",
                                                    todo.completed && "line-through text-black/40 decoration-black/20 decoration-2"
                                                )}
                                            >
                                                {todo.text}
                                            </span>
                                        </div>

                                        {/* Actions: Move & Delete */}
                                        <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="flex items-center gap-0 mr-1">
                                                <button
                                                    onClick={() => moveUp(index)}
                                                    disabled={index === 0}
                                                    className="p-1 hover:text-zinc-900 text-zinc-400 disabled:opacity-0 transition-colors"
                                                >
                                                    <ChevronUp size={16} />
                                                </button>
                                                <button
                                                    onClick={() => moveDown(index)}
                                                    disabled={index === todos.length - 1}
                                                    className="p-1 hover:text-zinc-900 text-zinc-400 disabled:opacity-0 transition-colors"
                                                >
                                                    <ChevronDown size={16} />
                                                </button>
                                            </div>

                                            <button
                                                onClick={() => removeTodo(todo.id)}
                                                className="h-8 w-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-destructive hover:bg-rose-50 transition-all"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Footer / Stats removed (moved to overlay) */}
                </div>
            </div>
        </BaseModal>
    );
}



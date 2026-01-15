import { useState } from "react";
import { BaseModal } from "@/components/base";
import { Input } from "@/components/ui/input";
import { useTodoStore } from "@/store/modules/todo";
import { cn } from "@/lib/utils";
import { Trash2, Plus, Check, ChevronUp, ChevronDown, X } from "lucide-react";
import { useLiveActivity } from "@/components/home/live/LiveActivityArea";
import { TodoLiveCard } from "@/components/home/live/TodoLiveCard";
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
    const clearCompleted = useTodoStore((s) => s.clearCompleted);
    const setTodos = useTodoStore((s) => s.setTodos);

    const [inputValue, setInputValue] = useState("");

    const handleAdd = (e?: React.FormEvent) => {
        e?.preventDefault();
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

    const completedCount = todos.filter(t => t.completed).length;

    const headerContent = (
        <div className="w-full flex items-center px-6 py-5 pointer-events-auto bg-linear-to-b from-white/30 to-transparent">
            {/* Input Fixed at Top */}
            <form onSubmit={handleAdd} className="flex-1 flex gap-3 items-center min-w-0 group/form">
                <div className="w-8 flex justify-center shrink-0">
                    {/* Circle using black border as requested */}
                    <div className="w-4 h-4 rounded-full border-2 border-black/30 bg-black/5" />
                </div>
                <div className="flex-1 relative">
                    <Input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder={t('add_task_placeholder')}
                        className="w-full bg-transparent border-none focus-visible:ring-0 text-base font-bold placeholder:text-zinc-400 h-10 p-0 text-zinc-800"
                        autoFocus
                    />
                    {/* Red baseline for text input as requested - Made bolder and redder */}
                    <div className="absolute bottom-1.5 left-0 right-0 h-[2.5px] bg-rose-500/80 transform scale-x-100 transition-transform origin-left" />
                </div>
                <button
                    type="submit"
                    disabled={!inputValue.trim()}
                    className="h-9 w-9 flex items-center justify-center rounded-xl bg-zinc-900 text-white shadow-sm hover:bg-black disabled:opacity-20 disabled:grayscale transition-all shrink-0"
                >
                    <Plus size={18} strokeWidth={3} />
                </button>
            </form>
        </div>
    );

    return (
        <BaseModal
            open={open}
            onOpenChange={onOpenChange}
            header={headerContent}
            background={<div className="absolute inset-0 bg-paper" />}
        >
            <div className="relative h-full flex flex-col pt-2 px-6 pb-6">
                <div className="relative z-10 flex flex-col h-full">
                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        {/* Todo List */}
                        <div className="space-y-0 text-zinc-800">
                            {todos.length === 0 ? (
                                <div className="text-center py-24 text-zinc-300 italic font-serif">
                                    {t('no_tasks')}
                                </div>
                            ) : (
                                todos.map((todo, index) => (
                                    <div
                                        key={todo.id}
                                        className={cn(
                                            "group flex items-center gap-3 min-h-[48px] border-b border-black/3 last:border-0 transition-opacity",
                                            todo.completed && "opacity-60"
                                        )}
                                    >
                                        {/* Drag/Reorder Controls (Discreet) */}
                                        <div className="w-8 flex flex-col items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => moveUp(index)}
                                                disabled={index === 0}
                                                className="hover:text-zinc-600 disabled:opacity-0"
                                            >
                                                <ChevronUp size={14} />
                                            </button>
                                            <button
                                                onClick={() => moveDown(index)}
                                                disabled={index === todos.length - 1}
                                                className="hover:text-zinc-600 disabled:opacity-0"
                                            >
                                                <ChevronDown size={14} />
                                            </button>
                                        </div>

                                        {/* Checkbox (Ink style) */}
                                        <button
                                            onClick={() => toggleTodo(todo.id)}
                                            className={cn(
                                                "shrink-0 h-6 w-6 rounded-lg border-2 transition-all flex items-center justify-center rotate-1",
                                                todo.completed
                                                    ? "bg-zinc-900 border-zinc-900 scale-90"
                                                    : "border-black/10 bg-white/40 hover:border-black/20"
                                            )}
                                        >
                                            {todo.completed && <Check size={16} strokeWidth={4} className="text-white -rotate-1" />}
                                        </button>

                                        {/* Text */}
                                        <span className={cn(
                                            "flex-1 text-[15px] font-medium transition-all py-3 px-1",
                                            todo.completed ? "line-through text-zinc-400 italic" : "text-zinc-800"
                                        )}>
                                            {todo.text}
                                        </span>

                                        {/* Delete Button */}
                                        <button
                                            onClick={() => removeTodo(todo.id)}
                                            className="opacity-0 group-hover:opacity-100 p-2 text-zinc-400 hover:text-destructive transition-all"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Footer / Stats */}
                    <div className="pt-4 mt-auto border-t border-black/3 flex items-center justify-end text-[11px] font-black uppercase tracking-widest text-black/20">
                        {completedCount > 0 && (
                            <button
                                onClick={clearCompleted}
                                className="hover:text-destructive transition-colors flex items-center gap-1.5"
                            >
                                <X size={12} />
                                {t('clear_completed', { count: completedCount })}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </BaseModal>
    );
}

export function TodoLiveActivity() {
    const todos = useTodoStore(s => s.todos);
    const [showDialog, setShowDialog] = useState(false);

    const pendingTodos = todos.filter(t => !t.completed);

    useLiveActivity("todo", pendingTodos.length > 0);

    if (pendingTodos.length === 0) return null;

    return (
        <>
            <TodoLiveCard onOpenDialog={() => setShowDialog(true)} />
            <TodoDialog open={showDialog} onOpenChange={setShowDialog} />
        </>
    );
}

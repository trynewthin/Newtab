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

    return (
        <BaseModal
            open={open}
            onOpenChange={onOpenChange}
            title={t('todo_list')}

        >
            <div className="py-2 space-y-4">
                {/* Add Form */}
                <form onSubmit={handleAdd} className="flex gap-2">
                    <Input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder={t('add_task_placeholder')}
                        className="h-10 bg-secondary/50 border-0 focus-visible:ring-1 focus-visible:ring-primary/20 rounded-lg"
                        autoFocus
                    />
                    <button
                        type="submit"
                        disabled={!inputValue.trim()}
                        className="h-10 w-10 flex items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
                    >
                        <Plus size={18} />
                    </button>
                </form>

                {/* Clear Completed Button */}
                {completedCount > 0 && (
                    <div className="flex justify-end">
                        <button
                            onClick={clearCompleted}
                            className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-destructive/10"
                        >
                            <X size={12} />
                            {t('clear_completed', { count: completedCount })}
                        </button>
                    </div>
                )}

                {/* Todo List */}
                <div className="space-y-2">
                    {todos.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground/50 text-sm">
                            {t('no_tasks')}
                        </div>
                    ) : (
                        todos.map((todo, index) => (
                            <div
                                key={todo.id}
                                className={cn(
                                    "group flex items-center gap-2 p-3 rounded-lg bg-secondary/30 border border-transparent hover:border-border/40 transition-all",
                                    todo.completed && "opacity-60 bg-secondary/10"
                                )}
                            >
                                {/* Reorder Buttons */}
                                <div className="flex flex-col gap-0.5">
                                    <button
                                        onClick={() => moveUp(index)}
                                        disabled={index === 0}
                                        className="p-0.5 text-muted-foreground/40 hover:text-muted-foreground disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                                        title={t('move_up')}
                                    >
                                        <ChevronUp size={14} />
                                    </button>
                                    <button
                                        onClick={() => moveDown(index)}
                                        disabled={index === todos.length - 1}
                                        className="p-0.5 text-muted-foreground/40 hover:text-muted-foreground disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                                        title={t('move_down')}
                                    >
                                        <ChevronDown size={14} />
                                    </button>
                                </div>

                                {/* Checkbox */}
                                <button
                                    onClick={() => toggleTodo(todo.id)}
                                    className={cn(
                                        "flex-shrink-0 h-5 w-5 rounded-full border border-primary/30 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20",
                                        todo.completed ? "bg-primary border-primary" : "hover:border-primary/60 bg-background"
                                    )}
                                >
                                    {todo.completed && <Check size={12} className="text-primary-foreground" />}
                                </button>

                                {/* Text */}
                                <span className={cn(
                                    "flex-1 text-sm font-medium transition-all break-all",
                                    todo.completed ? "line-through text-muted-foreground" : "text-foreground"
                                )}>
                                    {todo.text}
                                </span>

                                {/* Delete Button */}
                                <button
                                    onClick={() => removeTodo(todo.id)}
                                    className="opacity-0 group-hover:opacity-100 p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-all"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))
                    )}
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

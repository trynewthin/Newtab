import { useState } from "react";
import { Modal } from "@/components/common/Modal";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Trash2, Plus, Check, ChevronUp, ChevronDown, X } from "lucide-react";
import { useLiveActivity } from "../live/LiveActivityArea";
import { TodoLiveCard } from "../live/TodoLiveCard";
import type { Todo } from "@/lib/store/types";

interface TodoDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function TodoDialog({ open, onOpenChange }: TodoDialogProps) {
    const todos = useAppStore((s) => s.todos);
    const addTodo = useAppStore((s) => s.addTodo);
    const toggleTodo = useAppStore((s) => s.toggleTodo);
    const removeTodo = useAppStore((s) => s.removeTodo);
    const clearCompleted = useAppStore((s) => s.clearCompleted);
    const setTodos = useAppStore((s) => s.setTodos);

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
        <Modal
            open={open}
            onOpenChange={onOpenChange}
            title="Todo List"
            className="sm:max-w-[480px]"
        >
            <div className="p-6 space-y-4">
                {/* Add Form */}
                <form onSubmit={handleAdd} className="flex gap-2">
                    <Input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Add a new task..."
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
                            Clear {completedCount} completed
                        </button>
                    </div>
                )}

                {/* Todo List */}
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                    {todos.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground/50 text-sm">
                            No tasks yet. Start by adding one above!
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
                                        title="Move up"
                                    >
                                        <ChevronUp size={14} />
                                    </button>
                                    <button
                                        onClick={() => moveDown(index)}
                                        disabled={index === todos.length - 1}
                                        className="p-0.5 text-muted-foreground/40 hover:text-muted-foreground disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                                        title="Move down"
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
        </Modal>
    );
}

export function TodoLiveActivity() {
    const todos = useAppStore(s => s.todos);
    const [showDialog, setShowDialog] = useState(false);

    const pendingTodos = todos.filter(t => !t.completed);

    // Always show if there are pending todos
    useLiveActivity("todo", pendingTodos.length > 0);

    if (pendingTodos.length === 0) return null;

    return (
        <>
            <TodoLiveCard onOpenDialog={() => setShowDialog(true)} />
            <TodoDialog open={showDialog} onOpenChange={setShowDialog} />
        </>
    );
}

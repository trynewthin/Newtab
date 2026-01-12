import { useState } from "react";
import { useTodoStore } from "@/store/modules/todo";
import { cn } from "@/lib/utils";
import { ListTodo } from "lucide-react";
import { useTranslation } from "react-i18next";

interface TodoLiveCardProps {
    onOpenDialog: () => void;
}

export function TodoLiveCard({ onOpenDialog }: TodoLiveCardProps) {
    const { t } = useTranslation();
    const todos = useTodoStore((s) => s.todos);
    const toggleTodo = useTodoStore((s) => s.toggleTodo);
    const pendingTodos = todos.filter((t) => !t.completed);

    const [completingIds, setCompletingIds] = useState<string[]>([]);

    const MAX_DISPLAY = 2;
    const itemsToShow = pendingTodos.slice(0, MAX_DISPLAY);
    const overflow = pendingTodos.length - MAX_DISPLAY;

    const handleComplete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();

        if (completingIds.includes(id)) return;

        setCompletingIds(prev => [...prev, id]);

        setTimeout(() => {
            toggleTodo(id);
            setCompletingIds(prev => prev.filter(cid => cid !== id));
        }, 500);
    };

    return (
        <div
            onClick={onOpenDialog}
            className={cn(
                "group relative overflow-hidden rounded-[24px] py-3.5 px-5 cursor-pointer",
                "min-w-fit bg-secondary border border-border shadow-sm",
                "hover:border-primary/40 hover:shadow-md transition-all duration-300 ease-out",
                "animate-in slide-in-from-top-4 fade-in duration-500",
                "flex items-center gap-4"
            )}
        >
            <div className={cn(
                "relative flex items-center justify-center w-11 h-11 rounded-[14px] shrink-0",
                "bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-sm shadow-indigo-500/20"
            )}>
                <ListTodo className="w-5 h-5 text-white" />
                {overflow > 0 && (
                    <div className="absolute -top-1.5 -right-1.5 flex items-center justify-center h-5 min-w-[20px] px-1 rounded-full bg-destructive text-destructive-foreground ring-2 ring-background text-[10px] font-bold shadow-sm">
                        +{overflow}
                    </div>
                )}
            </div>

            <div className="flex flex-col justify-center gap-1.5 min-w-[140px] max-w-[200px]">
                {itemsToShow.length > 0 ? (
                    itemsToShow.map((todo) => {
                        const isCompleting = completingIds.includes(todo.id);
                        return (
                            <div
                                key={todo.id}
                                onClick={(e) => handleComplete(e, todo.id)}
                                className={cn(
                                    "flex items-center gap-2 border border-border/40 bg-background/40 rounded-[8px] px-2.5 py-1 transition-all duration-300",
                                    "hover:bg-background/80 hover:scale-[1.02] active:scale-95 cursor-pointer",
                                    isCompleting && "opacity-50 bg-secondary/50"
                                )}
                            >
                                <div className={cn(
                                    "w-1.5 h-1.5 rounded-full shrink-0 transition-colors duration-300",
                                    isCompleting ? "bg-muted-foreground" : "bg-indigo-500"
                                )} />
                                <span className={cn(
                                    "text-[11px] font-medium truncate max-w-[120px] leading-tight transition-all duration-300",
                                    isCompleting ? "line-through text-muted-foreground decoration-muted-foreground" : "text-foreground/90"
                                )}>
                                    {todo.text}
                                </span>
                            </div>
                        );
                    })
                ) : (
                    <span className="text-xs font-medium text-muted-foreground italic px-1">
                        {t('all_caught_up')}
                    </span>
                )}
            </div>
        </div>
    );
}

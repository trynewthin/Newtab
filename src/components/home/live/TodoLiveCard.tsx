import { useState } from "react";
import { useTodoStore } from "@/store/modules/todo";
import { cn } from "@/lib/utils";
import { ListTodo, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { BaseLiveCard } from "./BaseLiveCard";
import { useLiveActivity } from "./LiveActivityArea";

interface TodoLiveCardProps {
    onOpenDialog: () => void;
}

export function TodoLiveCard({ onOpenDialog }: TodoLiveCardProps) {
    const { t } = useTranslation();
    const todos = useTodoStore((s) => s.todos);
    const toggleTodo = useTodoStore((s) => s.toggleTodo);
    const pendingTodos = todos.filter((t) => !t.completed);

    const [completingIds, setCompletingIds] = useState<string[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showCompletion, setShowCompletion] = useState(false);

    // 注册活跃状态
    useLiveActivity('todo', pendingTodos.length > 0);

    const handleComplete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();

        if (completingIds.includes(id)) return;

        // 如果是最后一个任务，触发完成动画流程
        if (pendingTodos.length === 1) {
            setShowCompletion(true);

            // 1.5秒后执行完成逻辑
            setTimeout(() => {
                toggleTodo(id);
                setShowCompletion(false);
                setCurrentIndex(0);
            }, 1500);
            return;
        }

        // 否则执行普通的移除动画
        setCompletingIds(prev => [...prev, id]);

        setTimeout(() => {
            toggleTodo(id);
            setCompletingIds(prev => prev.filter(cid => cid !== id));

            // 如果完成的是当前显示的任务，重置索引
            if (currentIndex >= pendingTodos.length - 1) {
                setCurrentIndex(0);
            }
        }, 500);
    };

    const handleNext = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (pendingTodos.length > 0) {
            setCurrentIndex((prev) => (prev + 1) % pendingTodos.length);
        }
    };

    // 当前显示的任务
    const currentTodo = pendingTodos[currentIndex];
    const totalCount = pendingTodos.length;

    return (
        <BaseLiveCard
            onClick={onOpenDialog}
            showCompletion={showCompletion}
            icon={
                <>
                    <ListTodo className="w-5 h-5 text-white" />
                    {totalCount > 1 && (
                        <div className="absolute -top-1.5 -right-1.5 flex items-center justify-center h-5 min-w-[20px] px-1 rounded-full bg-red-500 text-white ring-2 ring-background text-[10px] font-bold shadow-sm">
                            {totalCount}
                        </div>
                    )}
                </>
            }
            iconBgGradient="from-blue-500 to-blue-600 shadow-blue-500/20"
            action={
                totalCount > 1 ? (
                    <button
                        onClick={handleNext}
                        className={cn(
                            "flex items-center justify-center w-10 h-10 rounded-full transition-all active:scale-95 shadow-sm border",
                            "bg-white border-blue-500/20 text-blue-500 hover:bg-blue-500 hover:text-white"
                        )}
                        title="Next task"
                    >
                        <RefreshCw className="w-4 h-4" strokeWidth={2.5} />
                    </button>
                ) : undefined
            }
        >
            {currentTodo ? (
                <div
                    onClick={(e) => handleComplete(e, currentTodo.id)}
                    className={cn(
                        "flex items-center h-11 max-w-[200px] border border-border/40 bg-background/40 rounded-[10px] px-3 transition-all duration-300",
                        "hover:bg-background/80 hover:scale-[1.02] active:scale-95 cursor-pointer",
                        completingIds.includes(currentTodo.id) && "opacity-50 bg-secondary/50"
                    )}
                >
                    <span className={cn(
                        "text-sm font-medium truncate flex-1 leading-tight transition-all duration-300",
                        completingIds.includes(currentTodo.id) ? "line-through text-muted-foreground decoration-muted-foreground" : "text-foreground"
                    )}>
                        {currentTodo.text}
                    </span>
                </div>
            ) : (
                <span className="text-sm font-medium text-muted-foreground italic px-1">
                    {t('all_caught_up')}
                </span>
            )}
        </BaseLiveCard>
    );
}

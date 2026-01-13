import { useState } from "react";
import { useTodoStore } from "@/store/modules/todo";
import { cn } from "@/lib/utils";
import { RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import todoIcon from "@/assets/todo-icon.png";
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
    const [isFinishing, setIsFinishing] = useState(false);

    // 用于保存正在结束时要处理的那个任务ID
    const [finishingId, setFinishingId] = useState<string | null>(null);

    // 注册活跃状态
    useLiveActivity('todo', pendingTodos.length > 0);

    const handleComplete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();

        if (completingIds.includes(id)) return;

        // 如果是最后一个任务，启动完成流程
        if (pendingTodos.length === 1) {
            setFinishingId(id);
            setIsFinishing(true);
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

    const handleFinish = () => {
        if (finishingId) {
            toggleTodo(finishingId);
            setFinishingId(null);
        }
        setIsFinishing(false);
        setCurrentIndex(0);
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
            isFinishing={isFinishing}
            onFinish={handleFinish}
            icon={
                <div className="relative w-full h-full">
                    <img src={todoIcon} alt="Todo" className="w-full h-full object-cover rounded-[14px]" />
                    {totalCount > 1 && (
                        <div className="absolute -top-1 -right-1 flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full bg-red-500 text-white ring-2 ring-background text-[10px] font-bold shadow-sm z-10">
                            {totalCount}
                        </div>
                    )}
                </div>
            }
            iconBgGradient="bg-transparent shadow-none"
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

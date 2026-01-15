import { useState } from "react";
import { useTodoStore } from "@/store/modules/todo";
import { cn } from "@/lib/utils";
import { RefreshCw, CheckCircle2, Circle } from "lucide-react";
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
    const [finishingId, setFinishingId] = useState<string | null>(null);

    useLiveActivity('todo', pendingTodos.length > 0);

    const handleComplete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (completingIds.includes(id)) return;

        if (pendingTodos.length === 1) {
            setFinishingId(id);
            setIsFinishing(true);
            return;
        }

        setCompletingIds(prev => [...prev, id]);
        setTimeout(() => {
            toggleTodo(id);
            setCompletingIds(prev => prev.filter(cid => cid !== id));
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

    const currentTodo = pendingTodos[currentIndex];
    const totalCount = pendingTodos.length;

    return (
        <BaseLiveCard
            onClick={onOpenDialog}
            isFinishing={isFinishing}
            onFinish={handleFinish}
            icon={
                <div className="relative w-full h-full p-0.5">
                    <img src={todoIcon} alt="Todo" className="w-full h-full object-cover rounded-[15px] shadow-sm transition-transform group-hover:scale-105 duration-500" />
                </div>
            }
            badge={
                totalCount > 1 ? (
                    <div className="flex items-center justify-center h-5 min-w-[20px] px-1 rounded-full bg-primary text-primary-foreground ring-4 ring-white/10 text-[10px] font-black shadow-xl animate-pulse">
                        {totalCount}
                    </div>
                ) : undefined
            }
            iconBgGradient="bg-transparent shadow-none"
            action={
                totalCount > 1 ? (
                    <button
                        onClick={handleNext}
                        className={cn(
                            "flex items-center justify-center w-11 h-11 rounded-[16px] transition-all active:scale-90 shadow-xl border",
                            "bg-white/10 dark:bg-white/5 border-white/20 text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary"
                        )}
                        title="Next task"
                    >
                        <RefreshCw className="w-5 h-5" strokeWidth={2.5} />
                    </button>
                ) : undefined
            }
        >
            {currentTodo ? (
                <div
                    onClick={(e) => handleComplete(e, currentTodo.id)}
                    className={cn(
                        "flex items-center h-12 w-full gap-3 bg-white/5 hover:bg-white/10 dark:bg-black/10 dark:hover:bg-black/20 rounded-[18px] px-4 transition-all duration-300 border border-white/10",
                        "hover:scale-[1.01] active:scale-[0.98] cursor-pointer group/todo",
                        completingIds.includes(currentTodo.id) && "opacity-50"
                    )}
                >
                    <div className="shrink-0 text-primary transition-transform group-hover/todo:scale-110">
                        {completingIds.includes(currentTodo.id) ? (
                            <CheckCircle2 size={18} strokeWidth={3} className="animate-in zoom-in duration-300" />
                        ) : (
                            <Circle size={18} strokeWidth={2.5} className="opacity-40 group-hover/todo:opacity-100" />
                        )}
                    </div>
                    <span className={cn(
                        "text-sm font-bold truncate flex-1 leading-tight tracking-tight transition-all duration-300",
                        completingIds.includes(currentTodo.id) ? "line-through text-muted-foreground/50" : "text-foreground group-hover/todo:text-primary"
                    )}>
                        {currentTodo.text}
                    </span>
                </div>
            ) : (
                <div className="flex flex-col gap-0.5">
                    <span className="text-[13px] font-extrabold text-primary tracking-tighter uppercase italic">Perfect</span>
                    <span className="text-[11px] font-medium text-muted-foreground/60 leading-none">
                        {t('all_caught_up')}
                    </span>
                </div>
            )}
        </BaseLiveCard>
    );
}

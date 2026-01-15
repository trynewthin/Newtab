import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface BaseLiveCardProps {
    onClick: () => void;
    icon: ReactNode;
    iconBgGradient: string;
    children: ReactNode;
    action?: ReactNode;
    className?: string;
    isFinishing?: boolean;
    onFinish?: () => void;
}

export function BaseLiveCard({
    onClick,
    icon,
    iconBgGradient,
    children,
    action,
    className,
    isFinishing = false,
    onFinish
}: BaseLiveCardProps) {
    const onFinishRef = useRef(onFinish);
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        onFinishRef.current = onFinish;
    }, [onFinish]);

    useEffect(() => {
        if (isFinishing) {
            const finishTimer = setTimeout(() => {
                setIsExiting(true);
                const exitTimer = setTimeout(() => {
                    onFinishRef.current?.();
                }, 500);
                return () => clearTimeout(exitTimer);
            }, 1500);
            return () => clearTimeout(finishTimer);
        }
    }, [isFinishing]);

    return (
        <div
            onClick={onClick}
            className={cn(
                "group relative overflow-hidden rounded-[28px] px-5 cursor-pointer",
                "min-w-[280px] h-[84px] transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]",
                "glass-card border-white/30 dark:border-white/10 shadow-2xl shadow-primary/5",
                "hover:scale-[1.02] hover:bg-white/60 dark:hover:bg-black/60 hover:shadow-primary/10",
                "animate-in slide-in-from-left-8 fade-in flex items-center gap-5",
                isExiting && "translate-x-full opacity-0 pointer-events-none",
                className
            )}
        >
            {/* 完成动画覆盖层 */}
            {isFinishing && (
                <div
                    className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-primary/20 backdrop-blur-xl animate-in fade-in duration-300"
                >
                    <div className="w-14 h-14 bg-white dark:bg-primary rounded-full flex items-center justify-center shadow-2xl animate-in zoom-in spin-in-12 duration-500">
                        <svg className="w-8 h-8 text-primary dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                </div>
            )}

            {/* 左侧图标区域 - 悬浮时呼吸动效 */}
            <div className={cn(
                "relative flex items-center justify-center w-14 h-14 rounded-[20px] shrink-0 transition-all duration-500",
                "bg-white/50 dark:bg-black/20 shadow-inner group-hover:scale-110",
                iconBgGradient
            )}>
                <div className="relative z-10 w-full h-full flex items-center justify-center p-2">
                    {icon}
                </div>
                {/* 装饰光圈 */}
                <div className="absolute inset-0 rounded-[20px] bg-primary/5 group-hover:bg-primary/10 animate-pulse transition-colors" />
            </div>

            {/* 中间内容区域 */}
            <div className="flex-1 min-w-0 pr-2">
                {children}
            </div>

            {/* 右侧操作按钮区域 */}
            {action && (
                <div className="shrink-0 animate-in fade-in zoom-in delay-300">
                    {action}
                </div>
            )}

            {/* 底部进度指示点（装饰） */}
            <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1 pt-1 opacity-40">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
            </div>
        </div>
    );
}

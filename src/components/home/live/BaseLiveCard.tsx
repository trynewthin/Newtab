import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface BaseLiveCardProps {
    /** 点击卡片的回调 */
    onClick: () => void;
    /** 左侧图标区域 */
    icon: ReactNode;
    /** 图标背景渐变类名 */
    iconBgGradient: string;
    /** 中间内容区域 */
    children: ReactNode;
    /** 右侧操作按钮（可选） */
    action?: ReactNode;
    /** 额外的类名 */
    className?: string;
    /** 是否正在进行完成流程 */
    isFinishing?: boolean;
    /** 完成动画结束后的回调（清理数据） */
    onFinish?: () => void;
}

/**
 * 基础实况卡片组件
 * 
 * 职责：
 * 1. 统一的 UI 结构和样式
 * 2. 统一的动画管理（入场、HOVER、完成动画、退出动画）
 */
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

    // 保持 callback 最新引用
    useEffect(() => {
        onFinishRef.current = onFinish;
    }, [onFinish]);

    // 监听完成状态，控制完整流程：完成动画(1.5s) -> 退出动画(0.5s) -> 清理数据
    useEffect(() => {
        if (isFinishing) {
            // 1. 等待完成动画
            const finishTimer = setTimeout(() => {
                // 2. 开始退出动画
                setIsExiting(true);

                // 3. 等待退出动画结束后，清理数据
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
                "group relative overflow-hidden rounded-[24px] px-4 cursor-pointer",
                "min-w-fit h-[72px] bg-secondary border border-border shadow-sm",
                "hover:border-primary/40 hover:shadow-md transition-all duration-300 ease-out",
                "animate-in slide-in-from-left-[200px] fade-in duration-500",
                // 退出动画样式：向右飞出并消失，不影响其他元素（因为很快就卸载了）
                isExiting && "translate-x-full opacity-0 duration-500 pointer-events-none",
                "flex items-center gap-4",
                className
            )}
        >
            {/* 完成动画覆盖层 - 由 BaseLiveCard 统一管理 */}
            {isFinishing && (
                <div
                    className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm animate-in fade-in duration-200"
                >
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shadow-lg animate-in zoom-in spin-in-12 duration-300">
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                </div>
            )}

            {/* 左侧图标区域 */}
            <div className={cn(
                "relative flex items-center justify-center w-11 h-11 rounded-[14px] shrink-0",
                "bg-gradient-to-br shadow-sm",
                iconBgGradient
            )}>
                {icon}
            </div>

            {/* 中间内容区域 */}
            <div className="flex-1 min-w-0">
                {children}
            </div>

            {/* 右侧操作按钮区域 */}
            {action && (
                <div className="shrink-0">
                    {action}
                </div>
            )}
        </div>
    );
}

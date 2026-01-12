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
    /** 是否显示完成动画 */
    showCompletion?: boolean;
    /** 完成动画结束后的回调 */
    onAnimationComplete?: () => void;
}

/**
 * 基础实况卡片组件
 * 
 * 提供统一的卡片布局：
 * - 左侧：图标区域（带渐变背景）
 * - 中间：自定义内容区域
 * - 右侧：可选的操作按钮
 */
export function BaseLiveCard({
    onClick,
    icon,
    iconBgGradient,
    children,
    action,
    className,
    showCompletion = false,
    onAnimationComplete
}: BaseLiveCardProps) {
    return (
        <div
            onClick={onClick}
            className={cn(
                "group relative overflow-hidden rounded-[24px] px-4 cursor-pointer",
                "min-w-fit h-[72px] bg-secondary border border-border shadow-sm",
                "hover:border-primary/40 hover:shadow-md transition-all duration-300 ease-out",
                "animate-in slide-in-from-left-[200px] fade-in duration-500",
                "flex items-center gap-4",
                className
            )}
        >
            {/* 完成动画覆盖层 - 只在卡片内部 */}
            {showCompletion && (
                <div
                    className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm animate-in fade-in duration-200"
                    onAnimationEnd={onAnimationComplete}
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

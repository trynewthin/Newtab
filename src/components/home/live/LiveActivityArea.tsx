import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

// Context to track which activities are currently active
interface LiveActivityContextType {
    reportActivity: (id: string, isActive: boolean) => void;
}

const LiveActivityContext = createContext<LiveActivityContextType | null>(null);

/**
 * Hook for child components to register their active status with the container
 */
export function useLiveActivity(id: string, isActive: boolean) {
    const ctx = useContext(LiveActivityContext);
    useEffect(() => {
        ctx?.reportActivity(id, isActive);
    }, [id, isActive, ctx]);
}

interface LiveActivityAreaProps {
    children: React.ReactNode;
    className?: string;
}

export function LiveActivityArea({ children, className }: LiveActivityAreaProps) {
    const [activeIds, setActiveIds] = useState<Set<string>>(new Set());
    const [hasData, setHasData] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [isExiting, setIsExiting] = useState(false);

    const reportActivity = useCallback((id: string, isActive: boolean) => {
        setActiveIds(prev => {
            const next = new Set(prev);
            if (isActive) next.add(id);
            else next.delete(id);

            if (next.size === prev.size && Array.from(next).every(v => prev.has(v))) {
                return prev;
            }
            return next;
        });
    }, []);

    // 监听 activeIds 变化来控制显示/退出动画
    useEffect(() => {
        const currentHasData = activeIds.size > 0;

        if (currentHasData) {
            // 有数据：立即显示，取消退出状态
            setHasData(true);
            setIsVisible(true);
            setIsExiting(false);
        } else if (hasData) {
            // 数据刚变为空：开始退出动画
            setHasData(false);
            setIsExiting(true);
            // 500ms 动画结束后隐藏
            const timer = setTimeout(() => {
                setIsVisible(false);
                setIsExiting(false);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [activeIds.size, hasData]);

    return (
        <LiveActivityContext.Provider value={{ reportActivity }}>
            <div
                className={cn(
                    "w-full max-w-4xl transition-all duration-500 ease-in-out overflow-hidden",
                    "flex flex-wrap items-center justify-center gap-4",
                    isVisible ? "h-auto opacity-100 pb-3 translate-x-0" : "h-0 opacity-0 pointer-events-none",
                    isExiting && "translate-x-full opacity-0",
                    className
                )}
            >
                {children}
            </div>
        </LiveActivityContext.Provider>
    );
}

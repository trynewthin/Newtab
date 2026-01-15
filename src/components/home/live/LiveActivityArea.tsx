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

    const hasActivities = activeIds.size > 0;

    return (
        <LiveActivityContext.Provider value={{ reportActivity }}>
            <div
                className={cn(
                    "w-full max-w-4xl transition-all duration-500 ease-in-out overflow-hidden",
                    "flex flex-wrap items-center justify-center gap-4",
                    hasActivities ? "h-auto opacity-100 pb-3 py-2" : "h-0 opacity-0 pointer-events-none",
                    className
                )}
            >
                {children}
            </div>
        </LiveActivityContext.Provider>
    );
}

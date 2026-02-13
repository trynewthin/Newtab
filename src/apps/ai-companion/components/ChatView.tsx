import { useRef, useEffect } from "react";
import { MessageRenderer } from "./MessageRenderer";
import type { Message, ModelConfig } from "@/apps/ai-companion";
import { cn } from "@/core/utils";

interface ChatViewProps {
    messages: Message[];
    activeModel?: ModelConfig;
    isLoading: boolean;
    className?: string;
}

export function ChatView({ messages, activeModel, isLoading, className }: ChatViewProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const timeout = setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
        return () => clearTimeout(timeout);
    }, [messages, isLoading]);

    return (
        <div className={cn("w-full space-y-5", className)}>
            <MessageRenderer messages={messages} activeModel={activeModel} />

            {isLoading && (
                <div className="pl-4 py-2 animate-pulse flex items-center gap-2 opacity-50">
                    <div className="w-1 h-1 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-1 h-1 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-1 h-1 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
            )}

            <div ref={messagesEndRef} className="h-1" />
        </div>
    );
}


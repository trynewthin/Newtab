import { useRef, useEffect } from "react";
import { MessageRenderer } from "./MessageRenderer";
import type { Message, ModelConfig } from "@/webagent";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatViewProps {
    messages: Message[];
    activeModel?: ModelConfig;
    isLoading: boolean;
    className?: string;
}

export function ChatView({ messages, activeModel, isLoading, className }: ChatViewProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // 智能滚动：如果用户已经翻上去看历史了，就不要强制滚到底部，除非是新消息刚发出�?
        // 这里简化处理：始终平滑滚动到底�?
        const timeout = setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
        return () => clearTimeout(timeout);
    }, [messages, isLoading]);

    return (
        <div className={cn("h-full w-full overflow-y-auto px-4 py-4 space-y-5 custom-scrollbar pb-4", className)}>
            {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-[60%] text-center px-6 opacity-40 select-none">
                    <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center mb-4">
                        <Sparkles size={32} className="text-primary" />
                    </div>
                    <h3 className="font-bold text-lg mb-1">Visual Web Agent</h3>
                    <p className="text-sm text-muted-foreground">Ready to browse, click, and explore.</p>
                </div>
            )}

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

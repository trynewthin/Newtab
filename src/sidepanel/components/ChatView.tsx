import { useRef, useEffect } from "react";
import { MessageRenderer } from "./MessageRenderer";
import type { Message, ModelConfig } from "@/webagent";

interface ChatViewProps {
    messages: Message[];
    activeModel?: ModelConfig;
    isLoading: boolean;
}

export function ChatView({ messages, activeModel, isLoading }: ChatViewProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // 延迟滚动，确保 DOM 渲染完毕
        requestAnimationFrame(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }));
    }, [messages]);

    return (
        <div className="h-full w-full overflow-y-auto px-5 py-6 space-y-6 custom-scrollbar pb-24">
            <MessageRenderer messages={messages} activeModel={activeModel} />

            {isLoading && (
                <div className="flex items-center gap-3 px-2 py-4 animate-pulse opacity-60">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span className="text-[11px] font-medium text-primary tracking-wide">AI is thinking...</span>
                </div>
            )}

            <div ref={messagesEndRef} />
        </div>
    );
}

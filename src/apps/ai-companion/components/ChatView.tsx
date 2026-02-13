import { useRef, useEffect } from "react";
import { MessageRenderer } from "./MessageRenderer";
import type { Message, ModelConfig } from "@/apps/ai-companion";
import { Sparkles } from "lucide-react";
import { cn } from "@/core/utils";
import { useTranslation } from "react-i18next";

interface ChatViewProps {
    messages: Message[];
    activeModel?: ModelConfig;
    isLoading: boolean;
    className?: string;
}

export function ChatView({ messages, activeModel, isLoading, className }: ChatViewProps) {
    const { t } = useTranslation();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const timeout = setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
        return () => clearTimeout(timeout);
    }, [messages, isLoading]);

    return (
        <div className={cn("h-full w-full overflow-y-auto px-4 py-4 space-y-5 custom-scrollbar pb-4", className)}>
            {messages.length === 0 && (
                <div className="flex h-[60%] select-none flex-col items-center justify-center px-6 text-center opacity-65">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl border border-border/70 bg-background">
                        <Sparkles size={32} className="text-foreground/75" />
                    </div>
                    <h3 className="mb-1 text-lg font-semibold tracking-tight">{t("visual_web_agent_title")}</h3>
                    <p className="text-sm text-muted-foreground/80">{t("visual_web_agent_desc")}</p>
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


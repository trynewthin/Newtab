import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Check, Square, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/core/utils";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import type { ModelConfig } from "@/apps/ai-companion";
import { useTranslation } from "react-i18next";

interface ChatInputProps {
    models: ModelConfig[];
    activeModelId: string | null;
    activeModel?: ModelConfig;
    setActiveModel: (id: string) => void;
    isLoading: boolean;
    onSend: (message: string) => Promise<void>;
    onStop: () => void;
}

export function ChatInput({
    models,
    activeModelId,
    activeModel,
    setActiveModel,
    isLoading,
    onSend,
    onStop
}: ChatInputProps) {
    const { t } = useTranslation();
    const [inputValue, setInputValue] = useState("");
    const [isModelOpen, setIsModelOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!isLoading) {
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isLoading]);

    const handleSend = async () => {
        if (!inputValue.trim() || isLoading) return;
        const text = inputValue.trim();
        setInputValue("");
        await onSend(text);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className={cn(
            "relative flex items-end gap-2 p-1.5 rounded-[22px] transition-all duration-300",
            "border border-border/70 bg-background/90 shadow-sm ring-1 ring-black/5 dark:ring-white/5",
            "focus-within:bg-background focus-within:border-foreground/20 focus-within:ring-foreground/15"
        )}>
            <div className="pb-0.5">
                <Popover open={isModelOpen} onOpenChange={setIsModelOpen}>
                    <PopoverTrigger className={cn(
                        "flex items-center gap-1.5 pl-3 pr-2 py-2 rounded-xl transition-all duration-300 outline-none",
                        "hover:bg-foreground/8 text-muted-foreground hover:text-foreground",
                        isModelOpen && "bg-background text-foreground",
                        isLoading && "text-foreground animate-pulse"
                    )}>
                        <Sparkles size={16} className={cn(isLoading && "animate-spin-slow")} />
                        <ChevronUp size={12} className={cn("transition-transform duration-300 opacity-50", isModelOpen ? "rotate-180" : "")} />
                    </PopoverTrigger>
                    <PopoverContent align="start" side="top" className="mb-2 w-[220px] rounded-xl border border-border/70 bg-background/95 p-1.5 shadow-xl">
                        <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">{t("select_model")}</div>
                        {models.map(m => (
                            <button
                                key={m.id}
                                onClick={() => {
                                    setActiveModel(m.id);
                                    setIsModelOpen(false);
                                }}
                                className={cn(
                                    "w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-all group",
                                    activeModelId === m.id
                                        ? "bg-foreground text-background"
                                        : "text-muted-foreground hover:bg-foreground/8 hover:text-foreground"
                                )}
                            >
                                <span className="truncate">{m.name}</span>
                                {activeModelId === m.id && <Check size={14} strokeWidth={2.5} />}
                            </button>
                        ))}
                    </PopoverContent>
                </Popover>
            </div>

            <Input
                ref={inputRef}
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isLoading ? t("agent_working") : (activeModel ? t("message_model_placeholder", { model: activeModel.name }) : t("type_message_placeholder"))}
                disabled={isLoading}
                className="min-h-[40px] flex-1 border-none bg-transparent px-3 py-2.5 text-sm font-medium shadow-none placeholder:text-muted-foreground/50 focus-visible:ring-0"
                autoComplete="off"
            />

            <div className="pb-0.5 pr-0.5">
                {isLoading ? (
                    <button
                        onClick={onStop}
                        className="group flex h-9 w-9 items-center justify-center rounded-xl bg-foreground text-background shadow-sm transition-all hover:scale-105 active:scale-95"
                        title={t("stop_generation")}
                    >
                        <Square size={14} fill="currentColor" className="group-hover:opacity-80 transition-opacity" />
                    </button>
                ) : (
                    <button
                        onClick={handleSend}
                        disabled={!inputValue.trim()}
                        className={cn(
                            "w-9 h-9 rounded-xl transition-all duration-300 flex items-center justify-center",
                            inputValue.trim()
                                ? "bg-foreground text-background shadow-sm hover:scale-105 active:scale-95"
                                : "bg-muted text-muted-foreground/40 cursor-not-allowed"
                        )}
                    >
                        <Send size={16} className={cn(inputValue.trim() ? "ml-0.5" : "")} />
                    </button>
                )}
            </div>
        </div>
    );
}


import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Check, Square, ChevronUp } from "lucide-react";
import { Input } from "@/shared/ui/input";
import { cn } from "@/core/utils";
import { Popover, PopoverTrigger, PopoverContent } from "@/shared/ui/popover";
import type { ModelConfig } from "@/features/ai-companion";

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
            "bg-background/40 backdrop-blur-md border border-white/10 shadow-lg ring-1 ring-black/5",
            "focus-within:bg-background/60 focus-within:ring-primary/20 focus-within:border-primary/30"
        )}>
            <div className="pb-0.5">
                <Popover open={isModelOpen} onOpenChange={setIsModelOpen}>
                    <PopoverTrigger className={cn(
                        "flex items-center gap-1.5 pl-3 pr-2 py-2 rounded-xl transition-all duration-300 outline-none",
                        "hover:bg-background/50 text-muted-foreground hover:text-foreground",
                        isModelOpen && "bg-background text-foreground",
                        isLoading && "text-primary animate-pulse"
                    )}>
                        <Sparkles size={16} className={cn(isLoading && "animate-spin-slow")} />
                        <ChevronUp size={12} className={cn("transition-transform duration-300 opacity-50", isModelOpen ? "rotate-180" : "")} />
                    </PopoverTrigger>
                    <PopoverContent align="start" side="top" className="w-[200px] p-1.5 bg-background/95 backdrop-blur-xl shadow-xl rounded-xl border-border/40 mb-2">
                        <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Select Model</div>
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
                                        ? "bg-primary text-primary-foreground"
                                        : "hover:bg-secondary text-muted-foreground hover:text-foreground"
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
                placeholder={isLoading ? "Agent is working..." : (activeModel ? `Message ${activeModel.name}...` : "Type a message...")}
                disabled={isLoading}
                className="flex-1 border-none shadow-none bg-transparent focus-visible:ring-0 px-3 py-2.5 text-sm min-h-[40px] placeholder:text-muted-foreground/30 font-medium"
                autoComplete="off"
            />

            <div className="pb-0.5 pr-0.5">
                {isLoading ? (
                    <button
                        onClick={onStop}
                        className="w-9 h-9 rounded-xl bg-destructive text-white shadow-lg shadow-destructive/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center group"
                        title="Stop Generation"
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
                                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:scale-105 active:scale-95"
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

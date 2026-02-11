import { useState, useRef, useEffect } from "react";
import { ArrowUp, Sparkles, Check, Square } from "lucide-react";
import { cn } from "@/platform/core/utils";
import { Popover, PopoverTrigger, PopoverContent } from "@/platform/shared/ui/popover";
import type { ModelConfig } from "@/apps/ai-companion";

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
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Auto-focus logic
    useEffect(() => {
        if (!isLoading) {
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isLoading]);

    useEffect(() => {
        if (!inputRef.current) return;
        inputRef.current.style.height = "0px";
        const nextHeight = Math.min(inputRef.current.scrollHeight, 160);
        inputRef.current.style.height = `${nextHeight}px`;
    }, [inputValue]);

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
            "bg-white/80 dark:bg-black/60 backdrop-blur-md border border-black/10 dark:border-white/10 shadow-lg ring-1 ring-black/5 dark:ring-white/10",
            "focus-within:bg-white/90 dark:focus-within:bg-black/70 focus-within:ring-black/10 dark:focus-within:ring-white/20 focus-within:border-black/20 dark:focus-within:border-white/20"
        )}>
            {/* Model Switcher */}
            <div className="pb-0.5">
                <Popover open={isModelOpen} onOpenChange={setIsModelOpen}>
                    <PopoverTrigger className={cn(
                        "w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 outline-none",
                        "hover:bg-black/5 dark:hover:bg-white/10 text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white",
                        isModelOpen && "bg-black/5 dark:bg-white/10 text-black dark:text-white",
                        isLoading && "text-black/60 dark:text-white/70 animate-pulse"
                    )}>
                        <Sparkles size={16} className={cn(isLoading && "animate-spin-slow")} />
                    </PopoverTrigger>
                    <PopoverContent align="start" side="top" className="w-[200px] p-1.5 bg-white/95 dark:bg-black/90 backdrop-blur-xl shadow-xl rounded-xl border border-black/10 dark:border-white/10 mb-2">
                        <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-widest text-black/50 dark:text-white/50">Select Model</div>
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
                                        ? "bg-black text-white dark:bg-white dark:text-black"
                                        : "hover:bg-black/5 dark:hover:bg-white/10 text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white"
                                )}
                            >
                                <span className="truncate">{m.name}</span>
                                {activeModelId === m.id && <Check size={14} strokeWidth={2.5} />}
                            </button>
                        ))}
                    </PopoverContent>
                </Popover>
            </div>

            {/* Input Field */}
            <textarea
                ref={inputRef}
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isLoading ? "Agent is working..." : (activeModel ? `Message ${activeModel.name}...` : "Type a message...")}
                disabled={isLoading}
                rows={1}
                className="flex-1 border-none shadow-none bg-transparent focus-visible:ring-0 outline-none focus:outline-none focus-visible:outline-none px-3 py-2.5 text-sm min-h-[40px] max-h-[160px] placeholder:text-black/30 dark:placeholder:text-white/30 font-medium text-black dark:text-white resize-none overflow-y-auto"
            />

            {/* Send/Stop Button */}
            <div className="pb-0.5 pr-0.5">
                {isLoading ? (
                    <button
                        onClick={onStop}
                        className="w-9 h-9 rounded-xl bg-black text-white dark:bg-white dark:text-black shadow-lg shadow-black/10 dark:shadow-white/10 hover:scale-105 active:scale-95 transition-all flex items-center justify-center group"
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
                                ? "bg-black text-white dark:bg-white dark:text-black shadow-lg shadow-black/10 dark:shadow-white/10 hover:scale-105 active:scale-95"
                                : "bg-black/5 dark:bg-white/10 text-black/40 dark:text-white/40 cursor-not-allowed"
                        )}
                    >
                        <ArrowUp size={16} />
                    </button>
                )}
            </div>
        </div>
    );
}


import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Check, Square, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import type { ModelConfig } from "@/webagent";

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

    // Auto-focus logic
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
        <div className="flex-none p-4 pb-6 bg-linear-to-t from-background via-background/95 to-transparent z-20">
            <div className={cn(
                "relative flex items-end gap-2 p-2 rounded-[28px] transition-all duration-300",
                "bg-background/40 backdrop-blur-md border border-white/10 shadow-lg ring-1 ring-black/5",
                "focus-within:bg-background/80 focus-within:shadow-xl focus-within:ring-primary/20 focus-within:border-primary/20"
            )}>
                {/* Model Switcher */}
                <div className="pb-0.5">
                    <Popover open={isModelOpen} onOpenChange={setIsModelOpen}>
                        <PopoverTrigger className={cn(
                            "flex items-center gap-1.5 pl-3 pr-2 py-2 rounded-full transition-all duration-300 outline-none",
                            "hover:bg-secondary/80 text-muted-foreground hover:text-foreground",
                            isModelOpen && "bg-secondary text-foreground",
                            isLoading && "text-primary animate-pulse"
                        )}>
                            <Sparkles size={16} className={cn(isLoading && "animate-spin-slow")} />
                            <ChevronUp size={12} className={cn("transition-transform duration-300 opacity-50", isModelOpen ? "rotate-180" : "")} />
                        </PopoverTrigger>
                        <PopoverContent align="start" side="top" className="w-[200px] p-1.5 bg-background/90 backdrop-blur-2xl shadow-2xl rounded-2xl border-white/10 ring-1 ring-black/5 mb-2">
                            <div className="px-2 py-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Select Model</div>
                            {models.map(m => (
                                <button
                                    key={m.id}
                                    onClick={() => {
                                        setActiveModel(m.id);
                                        setIsModelOpen(false);
                                    }}
                                    className={cn(
                                        "w-full text-left px-3 py-2.5 rounded-xl text-[12px] font-medium flex items-center justify-between transition-all group",
                                        activeModelId === m.id
                                            ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                                            : "hover:bg-secondary text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <span className="truncate">{m.name}</span>
                                    {activeModelId === m.id && <Check size={14} strokeWidth={3} />}
                                </button>
                            ))}
                        </PopoverContent>
                    </Popover>
                </div>

                {/* Input Field */}
                <Input
                    ref={inputRef}
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={isLoading ? "Agent is working..." : (activeModel ? `Message ${activeModel.name}...` : "Type a message...")}
                    disabled={isLoading}
                    className="flex-1 border-none shadow-none bg-transparent focus-visible:ring-0 px-2 py-3 text-[14px] min-h-[44px] placeholder:text-muted-foreground/40 font-medium"
                    autoComplete="off"
                />

                {/* Send/Stop Button */}
                <div className="pb-0.5 pr-0.5">
                    {isLoading ? (
                        <button
                            onClick={onStop}
                            className="w-10 h-10 rounded-full bg-destructive text-white shadow-lg shadow-destructive/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center group"
                            title="Stop Generation"
                        >
                            <Square size={14} fill="currentColor" className="group-hover:opacity-80 transition-opacity" />
                        </button>
                    ) : (
                        <button
                            onClick={handleSend}
                            disabled={!inputValue.trim()}
                            className={cn(
                                "w-10 h-10 rounded-full transition-all duration-300 flex items-center justify-center",
                                inputValue.trim()
                                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:scale-105 active:scale-95 hover:brightness-110"
                                    : "bg-secondary text-muted-foreground/30 cursor-not-allowed"
                            )}
                        >
                            <Send size={18} className={cn(inputValue.trim() ? "ml-0.5" : "")} />
                        </button>
                    )}
                </div>
            </div>

            {/* Input Context Hint (Optional) */}
            <div className="absolute bottom-1 left-0 right-0 text-center opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                <span className="text-[9px] text-muted-foreground/30 font-medium tracking-wide">Enter to send • Shift+Enter for new line</span>
            </div>
        </div>
    );
}

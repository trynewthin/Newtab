import { useState } from "react";
import { Send, Sparkles, Check, Square } from "lucide-react";
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
        <div className="flex-none p-4 pb-8 border-t border-border/40 bg-background/50 backdrop-blur-md">
            <div className="relative flex items-end gap-2 bg-secondary/20 border border-border/40 rounded-[24px] p-2 px-3 focus-within:ring-2 focus-within:ring-primary/10 transition-all">
                {/* Model Switcher */}
                <div className="pb-1">
                    <Popover open={isModelOpen} onOpenChange={setIsModelOpen}>
                        <PopoverTrigger className="p-2 text-muted-foreground hover:text-primary transition-all">
                            <Sparkles size={18} className={cn(isLoading && "text-primary")} />
                        </PopoverTrigger>
                        <PopoverContent align="start" side="top" className="w-[180px] p-1 bg-background/95 shadow-2xl rounded-xl border-border/50">
                            {models.map(m => (
                                <button
                                    key={m.id}
                                    onClick={() => {
                                        setActiveModel(m.id);
                                        setIsModelOpen(false);
                                    }}
                                    className={cn(
                                        "w-full text-left px-3 py-2 rounded-lg text-[11px] font-bold flex items-center justify-between",
                                        activeModelId === m.id
                                            ? "bg-primary/10 text-primary"
                                            : "hover:bg-muted text-muted-foreground"
                                    )}
                                >
                                    <span className="truncate">{m.name}</span>
                                    {activeModelId === m.id && <Check size={12} strokeWidth={4} />}
                                </button>
                            ))}
                        </PopoverContent>
                    </Popover>
                </div>

                {/* Input Field */}
                <Input
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={activeModel ? `Command ${activeModel.name}...` : "Command AI..."}
                    disabled={isLoading}
                    className="flex-1 border-none shadow-none bg-transparent focus-visible:ring-0 px-1 py-1 text-[14px] min-h-[40px]"
                    autoFocus
                />

                {/* Send/Stop Button */}
                {isLoading ? (
                    <button
                        onClick={onStop}
                        className="p-2 mb-1 rounded-full bg-destructive text-white shadow-lg hover:scale-105 active:scale-95 transition-all w-8 h-8 flex items-center justify-center"
                    >
                        <Square size={12} fill="currentColor" />
                    </button>
                ) : (
                    <button
                        onClick={handleSend}
                        disabled={!inputValue.trim()}
                        className={cn(
                            "p-2 mb-1 rounded-full transition-all w-8 h-8 flex items-center justify-center",
                            inputValue.trim()
                                ? "bg-primary text-white shadow-lg hover:scale-105 active:scale-95"
                                : "bg-muted text-muted-foreground/30"
                        )}
                    >
                        <Send size={15} strokeWidth={2.5} />
                    </button>
                )}
            </div>
        </div>
    );
}

import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Check, Square } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/shared/utils";
import type { ModelConfig } from "@/apps/ai-companion";
import { useTranslation } from "react-i18next";
import AppSurface from "@/platform/ui/surface/AppSurface";

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
            "relative rounded-xl",
            "shadow-[0_4px_16px_rgba(0,0,0,0.15),0_2px_6px_rgba(0,0,0,0.1)]",
            "dark:shadow-[0_4px_16px_rgba(255,255,255,0.08),0_2px_6px_rgba(255,255,255,0.05)]",
        )}>
            <div className="absolute inset-0 z-0 rounded-xl overflow-hidden">
                <AppSurface variant="toolbar" width="100%" height="100%" />
            </div>
            <div className="relative z-10 flex items-center gap-1 p-1.5">
                <div className="relative shrink-0">
                    <button
                        type="button"
                        onClick={() => setIsModelOpen(v => !v)}
                        className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 outline-none",
                            "hover:bg-foreground/8 text-muted-foreground hover:text-foreground",
                            isModelOpen && "bg-foreground text-background",
                            isLoading && "text-foreground animate-pulse"
                        )}
                    >
                        <Sparkles size={14} className={cn(isLoading && "animate-spin-slow")} />
                    </button>

                    {isModelOpen && (
                        <>
                            <div className="fixed inset-0 z-30" onClick={() => setIsModelOpen(false)} />
                            <div className={cn(
                                "absolute bottom-full left-0 mb-2 z-40 w-[220px]",
                                "overflow-hidden rounded-2xl",
                                "shadow-[0_4px_16px_rgba(0,0,0,0.15),0_2px_6px_rgba(0,0,0,0.1)]",
                                "dark:shadow-[0_4px_16px_rgba(255,255,255,0.08),0_2px_6px_rgba(255,255,255,0.05)]",
                            )}>
                                <div className="absolute inset-0 z-0 rounded-2xl overflow-hidden">
                                    <AppSurface variant="toolbar" width="100%" height="100%" borderRadius={16} />
                                </div>
                                <div className="relative z-10 p-2 space-y-0.5">
                                    <div className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">{t("select_model")}</div>
                                    {models.map(m => (
                                        <button
                                            key={m.id}
                                            onClick={() => {
                                                setActiveModel(m.id);
                                                setIsModelOpen(false);
                                            }}
                                            className={cn(
                                                "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200",
                                                activeModelId === m.id
                                                    ? "bg-foreground/16 text-foreground font-semibold"
                                                    : "text-foreground hover:bg-foreground/12"
                                            )}
                                        >
                                            <span className="truncate flex-1 text-left">{m.name}</span>
                                            {activeModelId === m.id && <Check size={13} strokeWidth={2.5} className="shrink-0" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <Input
                    ref={inputRef}
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={isLoading ? t("agent_working") : (activeModel ? t("message_model_placeholder", { model: activeModel.name }) : t("type_message_placeholder"))}
                    disabled={isLoading}
                    className="min-h-[36px] flex-1 border-none bg-transparent px-2 py-2 text-sm font-medium shadow-none placeholder:text-muted-foreground/50 focus-visible:ring-0"
                    autoComplete="off"
                />

                <div className="shrink-0">
                    {isLoading ? (
                        <button
                            onClick={onStop}
                            className="group flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background shadow-sm transition-all hover:scale-105 active:scale-95"
                            title={t("stop_generation")}
                        >
                            <Square size={12} fill="currentColor" className="group-hover:opacity-80 transition-opacity" />
                        </button>
                    ) : (
                        <button
                            onClick={handleSend}
                            disabled={!inputValue.trim()}
                            className={cn(
                                "w-8 h-8 rounded-lg transition-all duration-200 flex items-center justify-center",
                                inputValue.trim()
                                    ? "bg-foreground text-background shadow-sm hover:scale-105 active:scale-95"
                                    : "text-muted-foreground/30 cursor-not-allowed"
                            )}
                        >
                            <Send size={14} className={cn(inputValue.trim() ? "ml-0.5" : "")} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}


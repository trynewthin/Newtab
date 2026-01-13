
import { useState, useRef, useEffect } from "react";
import { BaseModal, ModalButton } from "@/components/base";
import { useAiStore } from "@/store/modules/ai";
import { useTranslation } from "react-i18next";
import { Send, Bot, User, Trash2, X, Sparkles, Check, MessageSquarePlus, History, Wrench, CheckCircle2, AlertCircle, Square, Circle, ListTodo } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { AiConfigTab } from "./AiConfigTab";
import { AiPreferencesTab } from "./AiPreferencesTab";
import { useAiChat } from "@/hooks/useAiChat";

interface AiDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AiDialog({ open, onOpenChange }: AiDialogProps) {
    const { t } = useTranslation();

    const messages = useAiStore(s => s.messages);
    const models = useAiStore(s => s.models);
    const activeModelId = useAiStore(s => s.activeModelId);
    const setActiveModel = useAiStore(s => s.setActiveModel);

    // Session Management Selectors
    const sessions = useAiStore(s => s.sessions);
    const currentSessionId = useAiStore(s => s.currentSessionId);
    const createSession = useAiStore(s => s.createSession);
    const deleteSession = useAiStore(s => s.deleteSession);
    const switchSession = useAiStore(s => s.switchSession);

    // Derived active model for display
    const activeModel = models.find(m => m.id === activeModelId);

    // Chat Hook
    const { sendMessage, stopGeneration, isLoading } = useAiChat();

    const [activeTab, setActiveTab] = useState<'chat' | 'config' | 'preferences'>('chat');
    const [isModelOpen, setIsModelOpen] = useState(false);
    const [isSessionsOpen, setIsSessionsOpen] = useState(false);
    const [inputValue, setInputValue] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom of chat
    useEffect(() => {
        if (activeTab === 'chat' && open) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, activeTab, open]);

    const handleSend = async () => {
        if (!inputValue.trim() || isLoading) return;
        const text = inputValue.trim();
        setInputValue("");
        await sendMessage(text);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // --- Layout Strategy ---
    const customOverlayLayer = (
        <div className="flex flex-col justify-between h-full w-full pointer-events-none select-none">

            {/* Top Bar: Tabs + Close */}
            <div className="flex items-center justify-between px-6 py-5 pointer-events-auto bg-gradient-to-b from-background via-background/60 to-transparent z-30">
                {/* Tabs Switcher */}
                <div className="bg-secondary/50 backdrop-blur-md p-1 rounded-xl border border-white/5 shadow-sm flex items-center gap-2">
                    <button
                        onClick={() => setActiveTab('chat')}
                        className={cn(
                            "px-4 py-1.5 text-sm font-medium rounded-lg transition-all",
                            activeTab === 'chat'
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                        )}
                    >
                        Chat
                    </button>
                    <button
                        onClick={() => setActiveTab('config')}
                        className={cn(
                            "px-4 py-1.5 text-sm font-medium rounded-lg transition-all",
                            activeTab === 'config'
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                        )}
                    >
                        {t('models')}
                    </button>
                    <button
                        onClick={() => setActiveTab('preferences')}
                        className={cn(
                            "px-4 py-1.5 text-sm font-medium rounded-lg transition-all",
                            activeTab === 'preferences'
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                        )}
                    >
                        {t('preferences')}
                    </button>
                </div>

                {/* Header Right Group: History & Close */}
                <div className="flex items-center gap-2 pointer-events-auto">

                    {/* Session Manager (History) */}
                    {activeTab === 'chat' && (
                        <Popover open={isSessionsOpen} onOpenChange={setIsSessionsOpen}>
                            <PopoverTrigger className="w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-white/10 hover:text-foreground transition-all outline-none border border-transparent hover:border-white/10">
                                <History size={18} />
                            </PopoverTrigger>
                            <PopoverContent align="end" className="w-[300px] p-2 bg-background/95 backdrop-blur-xl border-border/50 shadow-2xl rounded-2xl">
                                <button
                                    onClick={() => {
                                        createSession();
                                        setIsSessionsOpen(false);
                                    }}
                                    className="w-full flex items-center gap-2.5 px-4 py-3 rounded-xl bg-primary text-primary-foreground hover:brightness-110 transition-all text-sm font-semibold mb-3 shadow-lg shadow-primary/20"
                                >
                                    <MessageSquarePlus size={18} />
                                    <span>New Exploration</span>
                                </button>

                                <div className="text-[10px] font-bold text-muted-foreground px-3 pb-2 uppercase tracking-[0.1em] opacity-50">
                                    Recent Sessions
                                </div>

                                <div className="max-h-[350px] overflow-y-auto space-y-1 px-1 py-1 custom-scrollbar">
                                    {sessions.map(session => (
                                        <div
                                            key={session.id}
                                            className={cn(
                                                "group flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm transition-all cursor-pointer border border-transparent",
                                                currentSessionId === session.id
                                                    ? "bg-secondary text-foreground shadow-sm border-white/5"
                                                    : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                                            )}
                                            onClick={() => {
                                                switchSession(session.id);
                                                setIsSessionsOpen(false);
                                            }}
                                        >
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", currentSessionId === session.id ? "bg-primary" : "bg-muted-foreground/30")} />
                                                <span className="truncate font-medium">{session.title || "Untethered Thought"}</span>
                                            </div>

                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteSession(session.id);
                                                }}
                                                className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-destructive/10 hover:text-destructive rounded-lg transition-all shrink-0"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </PopoverContent>
                        </Popover>
                    )}

                    <div className="w-px h-5 bg-white/10 mx-1" />

                    {/* Close Button */}
                    <ModalButton onClick={() => onOpenChange(false)} className="w-9 h-9 rounded-xl hover:bg-destructive/10 hover:text-destructive border border-transparent hover:border-destructive/20 transition-all">
                        <X size={18} />
                    </ModalButton>
                </div>
            </div>

            {/* Bottom Bar: Input Area */}
            {activeTab === 'chat' && (
                <div className="px-6 pb-8 pt-12 pointer-events-auto bg-gradient-to-t from-background via-background/95 to-transparent z-30">
                    <div className={cn(
                        "relative group flex items-end gap-3 bg-secondary/20 border border-white/10 shadow-2xl p-2.5 rounded-[2rem] backdrop-blur-2xl transition-all",
                        "focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/40 focus-within:bg-background/80"
                    )}>

                        {/* Model Switcher */}
                        <div className="pl-1 pb-1">
                            <Popover open={isModelOpen} onOpenChange={setIsModelOpen}>
                                <PopoverTrigger className="p-2.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-2xl transition-all outline-none">
                                    <Sparkles
                                        size={20}
                                        className={cn("transition-all", isLoading ? "animate-pulse text-primary" : "group-hover:scale-110")}
                                    />
                                </PopoverTrigger>
                                <PopoverContent align="start" side="top" className="w-[240px] p-1.5 bg-background/98 backdrop-blur-2xl border-white/10 shadow-3xl rounded-2xl">
                                    <div className="px-3 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-50 border-b border-white/5 mb-1.5">
                                        Intelligence Source
                                    </div>
                                    <div className="max-h-[300px] overflow-y-auto space-y-1 custom-scrollbar">
                                        {models.map(model => (
                                            <button
                                                key={model.id}
                                                onClick={() => {
                                                    setActiveModel(model.id);
                                                    setIsModelOpen(false);
                                                }}
                                                className={cn(
                                                    "w-full text-left px-3 py-2.5 rounded-xl text-sm flex items-center justify-between transition-all",
                                                    activeModelId === model.id
                                                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                                        : "hover:bg-muted text-muted-foreground"
                                                )}
                                            >
                                                <span className="truncate font-medium">{model.name}</span>
                                                {activeModelId === model.id && <Check size={14} strokeWidth={3} />}
                                            </button>
                                        ))}
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>

                        <Input
                            value={inputValue}
                            onChange={e => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={activeModel ? `Ask ${activeModel.name}...` : "Intelligence awaiting..."}
                            disabled={isLoading}
                            className="flex-1 border-none shadow-none bg-transparent focus-visible:ring-0 px-2 py-3 min-h-[48px] max-h-48 text-[15px] leading-relaxed resize-none transition-all placeholder:text-muted-foreground/30"
                            autoFocus
                        />

                        <div className="flex items-center gap-2 pb-1.5 pr-1.5">
                            {inputValue && !isLoading && (
                                <button
                                    onClick={() => setInputValue("")}
                                    className="p-2.5 text-muted-foreground/30 hover:text-destructive hover:bg-destructive/10 rounded-full transition-all"
                                >
                                    <Trash2 size={18} />
                                </button>
                            )}

                            {isLoading ? (
                                <button
                                    onClick={stopGeneration}
                                    className="w-11 h-11 rounded-2xl transition-all shrink-0 bg-destructive text-destructive-foreground shadow-lg shadow-destructive/20 hover:scale-105 active:scale-95 flex items-center justify-center p-2.5"
                                >
                                    <Square size={20} fill="currentColor" />
                                </button>
                            ) : (
                                <button
                                    onClick={handleSend}
                                    disabled={!inputValue.trim()}
                                    className={cn(
                                        "p-2.5 rounded-2xl transition-all shrink-0 w-11 h-11 flex items-center justify-center shadow-lg",
                                        inputValue.trim()
                                            ? "bg-primary text-primary-foreground shadow-primary/30 hover:scale-105 active:scale-95"
                                            : "bg-muted text-muted-foreground/30 opacity-50"
                                    )}
                                >
                                    <Send size={20} className="ml-0.5" strokeWidth={2.5} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <BaseModal
            open={open}
            onOpenChange={onOpenChange}
            header={customOverlayLayer}
            background={<div className="absolute inset-0 bg-background/95 backdrop-blur-3xl" />}
            scrollable={false}
        >
            <div className="w-full h-full overflow-hidden">
                {activeTab === 'chat' ? (
                    <div className="h-full w-full overflow-y-auto custom-scrollbar">
                        <div className="flex flex-col min-h-full px-8 pt-[100px] pb-[130px]">
                            {/* Empty State */}
                            {messages.length === 0 && (
                                <div className="flex flex-col items-center justify-center flex-1 text-muted-foreground/20 space-y-6 py-20 pointer-events-none">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                                        <Bot size={80} strokeWidth={0.5} className="relative z-10 opacity-30 animate-pulse" />
                                    </div>
                                    <div className="text-center space-y-1">
                                        <h3 className="text-lg font-semibold text-muted-foreground/40 tracking-tight">System Ready</h3>
                                        <p className="text-xs font-medium uppercase tracking-[0.2em] opacity-30">Intelligence Interface v2.0</p>
                                    </div>
                                </div>
                            )}

                            {/* Messages */}
                            <div className="space-y-8 flex-1">
                                {messages.map((msg, idx) => {
                                    // 1. Plan Card Rendering
                                    if (msg.plan) {
                                        return (
                                            <div key={idx} className="flex flex-col gap-3 w-full animate-in fade-in zoom-in-95 duration-500">
                                                <div className="flex items-center gap-2.5 px-1">
                                                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-primary/10 text-primary border border-primary/20">
                                                        <ListTodo size={14} />
                                                    </div>
                                                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/60">Logic Workflow</span>
                                                </div>
                                                <div className="flex flex-col gap-4 p-6 bg-card/60 backdrop-blur-md border border-border/40 rounded-[1.5rem] shadow-2xl">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm font-semibold text-foreground/90">任务执行规划</span>
                                                        <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-mono font-bold tracking-tighter">
                                                            {msg.plan.currentIndex}/{msg.plan.steps.length} STEPS
                                                        </span>
                                                    </div>
                                                    <div className="space-y-2.5">
                                                        {msg.plan.steps.map((step, sIdx) => {
                                                            const isDone = sIdx < msg.plan!.currentIndex;
                                                            const isCurrent = sIdx === msg.plan!.currentIndex;
                                                            return (
                                                                <div key={sIdx} className={cn(
                                                                    "flex items-center gap-3 px-3 py-2 rounded-xl border transition-all",
                                                                    isCurrent ? "bg-primary/5 border-primary/30 shadow-sm" :
                                                                        isDone ? "bg-muted/30 border-transparent opacity-60" :
                                                                            "bg-muted/5 border-transparent opacity-40"
                                                                )}>
                                                                    <div className={cn(
                                                                        "w-5 h-5 rounded-full flex items-center justify-center shrink-0 border",
                                                                        isDone ? "bg-emerald-500 border-emerald-500 text-white" :
                                                                            isCurrent ? "bg-primary border-primary text-white animate-pulse" :
                                                                                "border-muted-foreground/30"
                                                                    )}>
                                                                        {isDone ? <Check size={12} strokeWidth={4} /> :
                                                                            isCurrent ? <Circle size={8} fill="currentColor" /> :
                                                                                <span className="text-[10px] font-bold">{sIdx + 1}</span>}
                                                                    </div>
                                                                    <span className={cn(
                                                                        "text-[13px] font-medium tracking-tight",
                                                                        isCurrent ? "text-foreground" : "text-muted-foreground",
                                                                        isDone && "line-through"
                                                                    )}>
                                                                        {step.description}
                                                                    </span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }

                                    // 2. Skip assistant tool-call placeholder
                                    if (msg.role === 'assistant' && !msg.content && msg.tool_calls) return null;

                                    // 3. Specialized Tool Card
                                    if (msg.role === 'tool') {
                                        const isPending = !msg.content;
                                        const isError = msg.content.toLowerCase().includes('error');
                                        return (
                                            <div key={idx} className="flex flex-col gap-2 w-full animate-in fade-in zoom-in-95 duration-300">
                                                <div className="flex items-center gap-2.5 px-1">
                                                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-muted/40 border border-dashed text-muted-foreground/50">
                                                        <Wrench size={14} className={cn(!isError && !isPending && "animate-pulse")} />
                                                    </div>
                                                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40">Action Layer</span>
                                                </div>
                                                <div className="flex items-center justify-between w-full max-w-lg px-6 py-4 bg-card border border-border/40 rounded-[1.5rem] group hover:bg-card/80 transition-all cursor-default shadow-xl">
                                                    <div className="flex items-center gap-5">
                                                        <div className={cn(
                                                            "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border border-dashed shadow-inner transition-all",
                                                            isPending ? "bg-primary/5 border-primary/40 animate-pulse scale-105" :
                                                                isError ? "bg-destructive/10 border-destructive/30 text-destructive" :
                                                                    "bg-primary/10 border-primary/30 text-primary"
                                                        )}>
                                                            {isPending ? (
                                                                <div className="w-6 h-6 border-[3px] border-primary border-t-transparent rounded-full animate-spin" />
                                                            ) : (
                                                                <Wrench size={24} />
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60 leading-none mb-1.5">Execution Trace</span>
                                                            <span className="text-[15px] font-mono font-semibold tracking-tight text-foreground/90">{msg.tool_name || "system_call"}</span>
                                                        </div>
                                                    </div>
                                                    <div className={cn(
                                                        "flex items-center gap-3 px-5 py-2 rounded-full border text-xs font-black shrink-0 shadow-lg tracking-widest transition-all",
                                                        isPending ? "bg-secondary/80 text-muted-foreground border-white/5" :
                                                            isError ? "bg-destructive/10 border-destructive/20 text-destructive" :
                                                                "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                                                    )}>
                                                        {isPending ? (
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                                                                <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                                                                <div className="w-2 h-2 rounded-full bg-primary animate-bounce" />
                                                            </div>
                                                        ) : (
                                                            <>
                                                                {isError ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
                                                                <span>{isError ? "FAILURE" : "SUCCESS"}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div
                                            key={idx}
                                            className={cn(
                                                "flex gap-5 animate-in fade-in slide-in-from-bottom-6 duration-500",
                                                msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-lg border-2 mt-0.5",
                                                msg.role === 'user'
                                                    ? "bg-primary text-primary-foreground border-white/10"
                                                    : "bg-muted text-foreground border-white/5"
                                            )}>
                                                {msg.role === 'user' ? <User size={20} strokeWidth={2.5} /> : <Bot size={20} strokeWidth={2} />}
                                            </div>

                                            <div className={cn(
                                                "max-w-[75%] rounded-[1.5rem] px-6 py-4 text-base leading-relaxed whitespace-pre-wrap select-text shadow-xl transition-all",
                                                msg.role === 'user'
                                                    ? "bg-primary text-primary-foreground rounded-tr-sm shadow-primary/10"
                                                    : "bg-card/40 backdrop-blur-md border border-white/5 text-card-foreground rounded-tl-sm"
                                            )}>
                                                {msg.content}
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>
                        </div>
                    </div>
                ) : activeTab === 'config' ? (
                    <div className="h-full w-full pt-[100px] pb-10 px-10 overflow-y-auto custom-scrollbar">
                        <AiConfigTab />
                    </div>
                ) : (
                    <div className="h-full w-full pt-[100px] pb-10 px-10 overflow-y-auto custom-scrollbar">
                        <AiPreferencesTab />
                    </div>
                )}
            </div>
        </BaseModal>
    );
}

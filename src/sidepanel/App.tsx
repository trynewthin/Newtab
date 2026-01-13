import { useState, useRef, useEffect, useMemo } from "react";
import { useAiStore } from "@/store/modules/ai";
import { Send, Bot, User, Trash2, Sparkles, Check, MessageSquarePlus, History, Clock, Download, Square, ListTodo, Layers } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { AiConfigTab } from "@/components/items/ai/AiConfigTab";
import { AiPreferencesTab } from "@/components/items/ai/AiPreferencesTab";
import { useAiChat } from "@/hooks/useAiChat";

function App() {
    const messages = useAiStore(s => s.messages);
    const models = useAiStore(s => s.models);
    const activeModelId = useAiStore(s => s.activeModelId);
    const setActiveModel = useAiStore(s => s.setActiveModel);
    const sessions = useAiStore(s => s.sessions);
    const currentSessionId = useAiStore(s => s.currentSessionId);
    const createSession = useAiStore(s => s.createSession);
    const deleteSession = useAiStore(s => s.deleteSession);
    const switchSession = useAiStore(s => s.switchSession);
    const activeModel = models.find(m => m.id === activeModelId);
    const { sendMessage, stopGeneration, isLoading } = useAiChat();

    const [activeTab, setActiveTab] = useState<'chat' | 'config' | 'preferences'>('chat');
    const [isModelOpen, setIsModelOpen] = useState(false);
    const [isSessionsOpen, setIsSessionsOpen] = useState(false);
    const [inputValue, setInputValue] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (activeTab === 'chat') {
            // 延迟滚动，确保 DOM 渲染完毕
            requestAnimationFrame(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }));
        }
    }, [messages, activeTab]);

    /**
     * UI 渲染器 v4.0 - Block-Based Grouping
     * 将连续的 Tool/Assistant(Intermediate) 消息聚合为一个 "Step Card"。
     */
    const renderContent = useMemo(() => {
        const elements: React.ReactNode[] = [];
        // 临时分组缓冲区
        let currentStepGroup: any[] = [];
        // 辅助函数：提交缓冲区并生成卡片
        const flushGroup = (idxKey: number, isFinished: boolean) => {
            if (currentStepGroup.length === 0) return;

            // 分析这一组操作中最核心的行为
            // 如果包含了 set_task_plan，说明这是 Plan 阶段，不渲染为 Execution Card
            const hasPlan = currentStepGroup.some(m => m.tool_calls?.some((tc: any) => tc.function.name === 'set_task_plan'));
            if (hasPlan) {
                currentStepGroup = []; return;
            }

            // 提取核心 Tool Name
            let toolName = "Processing";
            let toolCount = 0;

            // 扫描整个 Group 中的工具调用
            currentStepGroup.forEach(m => {
                if (m.tool_calls) {
                    toolName = m.tool_calls[0].function.name;
                    toolCount += m.tool_calls.length;
                }
            });

            // 尝试获取当前 Step 的描述
            const displayToolName = toolName.split('_').pop()?.toUpperCase() || "ACTION";

            // 渲染 Step Card
            elements.push(
                <div key={`step-group-${idxKey}`} className={cn(
                    "flex flex-col gap-2 w-full animate-in slide-in-from-left-2 duration-300 my-2",
                    isFinished ? "opacity-70" : "opacity-100"
                )}>
                    <div className={cn(
                        "rounded-xl p-3 flex items-center justify-between gap-3 border transition-all",
                        isFinished ? "bg-secondary/10 border-border/30" : "bg-background/80 border-primary/20 shadow-md ring-1 ring-primary/5"
                    )}>
                        <div className="flex items-center gap-3 min-w-0">
                            <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                                isFinished ? "bg-secondary text-muted-foreground" : "bg-primary/10 text-primary"
                            )}>
                                {isFinished ? <Clock size={14} /> : <Layers size={14} className="animate-pulse" />}
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/60">
                                    {isFinished ? "Step Completed" : "Executing Step"}
                                </span>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold truncate text-foreground/90">
                                        {displayToolName}
                                    </span>
                                    {toolCount > 1 && (
                                        <span className="bg-muted text-[9px] px-1.5 py-0.5 rounded-full text-muted-foreground font-mono">
                                            x{toolCount}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {isFinished ? (
                            <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 border border-emerald-500/20">
                                <Check size={12} strokeWidth={3} />
                            </div>
                        ) : (
                            <div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin shrink-0" />
                        )}
                    </div>
                </div>
            );
            currentStepGroup = [];
        };

        for (let i = 0; i < messages.length; i++) {
            const msg = messages[i];

            // 1. Plan Card (独立渲染，不参与 Group)
            if (msg.plan) {
                // 如果之前有积压的 Group，先吐出来（虽然理论上 Plan 会把之前的过程打断）
                flushGroup(i, true);

                elements.push(
                    <div key={`plan-${i}`} className="flex flex-col gap-2 w-full animate-in fade-in zoom-in-95 duration-500 my-4">
                        <div className="flex items-center gap-2 px-1 text-primary/60">
                            <ListTodo size={14} strokeWidth={2.5} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Global Roadmap</span>
                        </div>
                        <div className="p-4 bg-primary/5 border border-primary/10 rounded-[24px] space-y-2 shadow-sm">
                            {msg.plan.steps.map((step: any, sIdx: number) => {
                                const isDone = sIdx < msg.plan!.currentIndex;
                                const isCurrent = sIdx === msg.plan!.currentIndex;
                                return (
                                    <div key={sIdx} className={cn(
                                        "flex items-center gap-3 px-3 py-2 rounded-xl transition-all border",
                                        isCurrent ? "bg-background border-primary/20 shadow-sm" : "border-transparent opacity-50 text-muted-foreground"
                                    )}>
                                        <div className={cn(
                                            "w-5 h-5 rounded-full flex items-center justify-center shrink-0 border text-[10px] font-bold transition-colors",
                                            isDone ? "bg-emerald-500 border-emerald-500 text-white" :
                                                isCurrent ? "bg-primary border-primary text-white" : "border-muted-foreground/30"
                                        )}>
                                            {isDone ? <Check size={10} strokeWidth={4} /> : sIdx + 1}
                                        </div>
                                        <span className={cn("text-xs font-medium truncate", isCurrent && "font-bold text-foreground")}>{step.description}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
                continue;
            }

            // 2. Tool / Intermediate Assistant (加入 Group)
            if (msg.role === 'tool' || (msg.role === 'assistant' && msg.tool_calls) || (msg.role === 'assistant' && msg.isIntermediate)) {

                // 跳过纯 Set Task Plan 的回执，防止干扰 UI
                const isMeta = msg.tool_calls?.some((tc: any) => tc.function.name === 'set_task_plan') || msg.tool_name === 'set_task_plan';
                if (!isMeta) {
                    currentStepGroup.push(msg);
                }

                // 判断是否 Group 结束：
                // 如果已经在最后一条，或者下一条不是 Tool/Intermediate，则 Flush
                const nextMsg = messages[i + 1];
                const isGroupEnd = !nextMsg || !(
                    nextMsg.role === 'tool' ||
                    (nextMsg.role === 'assistant' && nextMsg.tool_calls) ||
                    (nextMsg.role === 'assistant' && nextMsg.isIntermediate)
                );

                if (isGroupEnd) {
                    // 判断这个 Group 是“进行中”还是“已完成”
                    // 只要它不再是整个 Message 列表的末尾，通常就意味着完成了
                    const isFinished = !!nextMsg;
                    flushGroup(i, isFinished);
                }
                continue;
            }

            // 3. User / Summary (Flush Group 并 独立渲染)
            flushGroup(i, true);

            elements.push(
                <div key={`chat-${i}`} className={cn(
                    "flex flex-col gap-1.5 w-full animate-in fade-in slide-in-from-bottom-2 my-2",
                    msg.role === 'user' ? "items-end" : "items-start"
                )}>
                    {!msg.isSummary && (
                        <div className={cn("flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground/40 px-1", msg.role === 'user' ? "flex-row-reverse" : "flex-row")}>
                            <div className={cn("w-5 h-5 rounded-full flex items-center justify-center border", msg.role === 'user' ? "bg-primary text-white border-transparent" : "bg-muted shadow-sm")}>
                                {msg.role === 'user' ? <User size={10} /> : <Bot size={10} />}
                            </div>
                            <span>{msg.role === 'user' ? "You" : "AI"}</span>
                        </div>
                    )}
                    <div className={cn(
                        "max-w-[100%] transition-all",
                        msg.role === 'user'
                            ? "bg-primary text-primary-foreground px-4 py-2 rounded-[20px] rounded-tr-none shadow-md text-[14px] font-medium"
                            : "bg-transparent text-foreground/90 py-1 text-[15px] font-medium leading-relaxed whitespace-pre-wrap select-text"
                    )}>
                        {msg.content}
                    </div>
                </div>
            );
        }

        // 扫尾：确保最后残留的 Group 被渲染
        flushGroup(messages.length, false);

        return elements;
    }, [messages, activeModel]);

    const handleSend = async () => {
        if (!inputValue.trim() || isLoading) return;
        const text = inputValue.trim();
        setInputValue("");
        await sendMessage(text);
    };

    return (
        <div className="w-full h-screen bg-background text-foreground flex flex-col font-sans select-none overflow-hidden text-[13px]">
            <div className="flex-none flex items-center justify-between px-4 py-3 border-b border-border/40 bg-background/50 backdrop-blur-md sticky top-0 z-10">
                <div className="flex bg-secondary/50 p-1 rounded-xl">
                    {(['chat', 'config', 'preferences'] as const).map(t => (
                        <button key={t} onClick={() => setActiveTab(t)} className={cn("px-4 py-1.5 text-[11px] font-bold rounded-lg transition-all uppercase tracking-widest", activeTab === t ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground")}>{t.slice(0, 4)}</button>
                    ))}
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={() => {
                        const data = JSON.stringify(messages, null, 2);
                        const blob = new Blob([data], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url; a.download = `debug-${Date.now()}.json`; a.click();
                        URL.revokeObjectURL(url);
                    }} className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors"><Download size={15} /></button>
                    {activeTab === 'chat' && (
                        <Popover open={isSessionsOpen} onOpenChange={setIsSessionsOpen}>
                            <PopoverTrigger className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors"><History size={15} /></PopoverTrigger>
                            <PopoverContent align="end" className="w-[240px] p-2 bg-background/95 backdrop-blur-xl border-border/50 shadow-2xl rounded-2xl">
                                <button onClick={() => { createSession(); setIsSessionsOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-all text-xs font-bold mb-2"><MessageSquarePlus size={14} /> <span>New Chat</span></button>
                                <div className="max-h-[300px] overflow-y-auto space-y-1">
                                    {sessions.map(s => (
                                        <div key={s.id} onClick={() => { switchSession(s.id); setIsSessionsOpen(false); }} className={cn("group flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs cursor-pointer", currentSessionId === s.id ? "bg-secondary text-foreground" : "hover:bg-muted text-muted-foreground")}>
                                            <span className="truncate flex-1 font-medium">{s.title || "Untitled"}</span>
                                            <button onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }} className="opacity-0 group-hover:opacity-100 p-1 hover:text-destructive"><Trash2 size={12} /></button>
                                        </div>
                                    ))}
                                </div>
                            </PopoverContent>
                        </Popover>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-hidden relative">
                {activeTab === 'chat' ? (
                    <div className="h-full w-full overflow-y-auto px-5 py-6 space-y-6 custom-scrollbar pb-24">
                        {renderContent}

                        {isLoading && (
                            <div className="flex items-center gap-3 px-2 py-4 animate-pulse opacity-60">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                <span className="text-[11px] font-medium text-primary tracking-wide">AI is thinking...</span>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                ) : activeTab === 'config' ? (
                    <div className="h-full overflow-y-auto p-4"><AiConfigTab /></div>
                ) : (<div className="h-full overflow-y-auto p-4"><AiPreferencesTab /></div>)}
            </div>

            {activeTab === 'chat' && (
                <div className="flex-none p-4 pb-8 border-t border-border/40 bg-background/50 backdrop-blur-md">
                    <div className="relative flex items-end gap-2 bg-secondary/20 border border-border/40 rounded-[24px] p-2 px-3 focus-within:ring-2 focus-within:ring-primary/10 transition-all">
                        <div className="pb-1">
                            <Popover open={isModelOpen} onOpenChange={setIsModelOpen}>
                                <PopoverTrigger className="p-2 text-muted-foreground hover:text-primary transition-all"><Sparkles size={18} className={cn(isLoading && "text-primary")} /></PopoverTrigger>
                                <PopoverContent align="start" side="top" className="w-[180px] p-1 bg-background/95 shadow-2xl rounded-xl border-border/50">
                                    {models.map(m => (
                                        <button key={m.id} onClick={() => { setActiveModel(m.id); setIsModelOpen(false); }} className={cn("w-full text-left px-3 py-2 rounded-lg text-[11px] font-bold flex items-center justify-between", activeModelId === m.id ? "bg-primary/10 text-primary" : "hover:bg-muted text-muted-foreground")}>
                                            <span className="truncate">{m.name}</span>
                                            {activeModelId === m.id && <Check size={12} strokeWidth={4} />}
                                        </button>
                                    ))}
                                </PopoverContent>
                            </Popover>
                        </div>
                        <Input
                            value={inputValue}
                            onChange={e => setInputValue(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                            placeholder={activeModel ? `Command ${activeModel.name}...` : "Command AI..."}
                            disabled={isLoading}
                            className="flex-1 border-none shadow-none bg-transparent focus-visible:ring-0 px-1 py-1 text-[14px] min-h-[40px]"
                            autoFocus
                        />
                        {isLoading ? (
                            <button onClick={stopGeneration} className="p-2 mb-1 rounded-full bg-destructive text-white shadow-lg hover:scale-105 active:scale-95 transition-all w-8 h-8 flex items-center justify-center"><Square size={12} fill="currentColor" /></button>
                        ) : (
                            <button onClick={handleSend} disabled={!inputValue.trim()} className={cn("p-2 mb-1 rounded-full transition-all w-8 h-8 flex items-center justify-center", inputValue.trim() ? "bg-primary text-white shadow-lg hover:scale-105 active:scale-95" : "bg-muted text-muted-foreground/30")}><Send size={15} strokeWidth={2.5} /></button>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export default App;

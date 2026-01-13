import { useMemo } from "react";
import { Bot, User, Clock, Layers, Check, ListTodo } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Message, ModelConfig } from "@/webagent";

interface MessageRendererProps {
    messages: Message[];
    activeModel?: ModelConfig;
}

export function MessageRenderer({ messages, activeModel }: MessageRendererProps) {
    /**
     * 渲染单条消息的内容（支持多模态）
     * 增强防御，防止 Object as React child 错误
     */
    const renderMessageContent = (content: any) => {
        if (!content) return null;
        if (typeof content === "string") {
            return content;
        }

        // 处理数组格式
        if (Array.isArray(content)) {
            return (
                <div className="flex flex-col gap-2">
                    {content.map((item, idx) => {
                        if (!item) return null;
                        if (typeof item === "string") return <div key={idx}>{item}</div>;

                        if (item.type === "text") {
                            return <div key={idx} className="whitespace-pre-wrap leading-relaxed">{item.text}</div>;
                        }
                        if (item.type === "image_url") {
                            return (
                                <div key={idx} className="mt-1 rounded-xl overflow-hidden border border-white/10 shadow-lg max-w-[240px] group transition-all hover:ring-2 hover:ring-primary/20">
                                    <img
                                        src={item.image_url.url}
                                        alt="Browser Screenshot"
                                        className="w-full h-auto cursor-zoom-in group-hover:scale-[1.02] transition-transform duration-300"
                                        onClick={() => window.open(item.image_url.url, '_blank')}
                                    />
                                    <div className="bg-background/80 backdrop-blur-md px-2 py-1 text-[9px] font-bold text-muted-foreground uppercase tracking-widest border-t border-white/5">
                                        Captured Frame
                                    </div>
                                </div>
                            );
                        }
                        return null;
                    })}
                </div>
            );
        }

        // 处理单个对象格式（防御）
        if (typeof content === "object") {
            if (content.type === "text") return <div className="whitespace-pre-wrap">{content.text}</div>;
            if (content.type === "image_url") {
                return <img src={content.image_url.url} className="max-w-[240px] rounded-xl" />;
            }
            // 最后的兜底：转字符，避免 React 渲染对象崩溃
            if (content.text) return String(content.text);
            return JSON.stringify(content);
        }

        return String(content);
    };

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
                currentStepGroup = [];
                return;
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
            if (!msg) continue;

            // 1. Plan Card (独立渲染，不参与 Group)
            if (msg.plan) {
                // 如果之前有积压的 Group，先吐出来
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

                // 判断是否 Group 结束
                const nextMsg = messages[i + 1];
                const isGroupEnd = !nextMsg || !(
                    nextMsg.role === 'tool' ||
                    (nextMsg.role === 'assistant' && nextMsg.tool_calls) ||
                    (nextMsg.role === 'assistant' && nextMsg.isIntermediate)
                );

                if (isGroupEnd) {
                    const isFinished = !!nextMsg;
                    flushGroup(i, isFinished);
                }
                continue;
            }

            // 3. User / Summary (Flush Group 并独立渲染)
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
                            : "bg-transparent text-foreground/90 py-1 text-[15px] font-medium"
                    )}>
                        {renderMessageContent(msg.content)}
                    </div>
                </div>
            );
        }

        // 扫尾：确保最后残留的 Group 被渲染
        flushGroup(messages.length, false);

        return elements;
    }, [messages, activeModel]);

    return <>{renderContent}</>;
}

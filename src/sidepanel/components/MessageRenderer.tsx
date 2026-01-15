import { useMemo } from "react";
import { Bot, User, Clock, Layers, Check } from "lucide-react";
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
     * UI 渲染器 v5.0 - Streamlined Chat
     * 移除 Global Roadmap，专注于对话流和工具执行块。
     */
    const renderContent = useMemo(() => {
        const elements: React.ReactNode[] = [];
        // 临时分组缓冲区 (用于把连续的 Tool Execution 合并显示)
        let currentStepGroup: any[] = [];

        // 辅助函数：提交缓冲区并生成Tool卡片
        const flushGroup = (idxKey: number, isFinished: boolean) => {
            if (currentStepGroup.length === 0) return;

            // 提取核心 Tool Name 和截图数据
            let toolName = "Processing";
            let toolCount = 0;
            let screenshotUrl: string | null = null;

            currentStepGroup.forEach(m => {
                if (m.tool_calls) {
                    toolName = m.tool_calls[0].function.name;
                    toolCount += m.tool_calls.length;
                }
                // 检查是否有截图数据
                if (m.role === 'tool' && typeof m.content === 'string' && m.content.startsWith('IMAGE_DATA:')) {
                    screenshotUrl = m.content.replace('IMAGE_DATA:', '');
                }
            });

            const displayToolName = toolName.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

            // 渲染 Tool Execution Card
            elements.push(
                <div key={`step-group-${idxKey}`} className={cn(
                    "flex flex-col gap-2 w-full animate-in slide-in-from-left-2 duration-300 my-2",
                    isFinished ? "opacity-70" : "opacity-100"
                )}>
                    <div className={cn(
                        "rounded-xl p-3 border transition-all",
                        isFinished ? "bg-secondary/5 border-border/30" : "bg-background/80 border-primary/20 shadow-md ring-1 ring-primary/5"
                    )}>
                        <div className="flex items-center justify-between gap-3 mb-2">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                                    isFinished ? "bg-secondary text-muted-foreground" : "bg-primary/10 text-primary"
                                )}>
                                    {isFinished ? <Clock size={14} /> : <Layers size={14} className="animate-pulse" />}
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/60">
                                        {isFinished ? "Action Performed" : "Agent Acting"}
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

                        {/* 如果有截图，显示缩略图 */}
                        {screenshotUrl && (
                            <div className="mt-2 rounded-lg overflow-hidden border border-white/10 shadow-md max-w-[280px] group cursor-zoom-in hover:ring-2 hover:ring-primary/30 transition-all">
                                <img
                                    src={screenshotUrl}
                                    alt="Screenshot captured by AI"
                                    className="w-full h-auto group-hover:scale-[1.02] transition-transform duration-300"
                                    onClick={() => screenshotUrl && window.open(screenshotUrl, '_blank')}
                                />
                                <div className="bg-background/90 backdrop-blur-sm px-2 py-1 text-[9px] font-bold text-muted-foreground uppercase tracking-widest border-t border-white/5">
                                    AI Vision Input
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            );
            currentStepGroup = [];
        };

        for (let i = 0; i < messages.length; i++) {
            const msg = messages[i];
            if (!msg) continue;

            // 1. Tool / Intermediate Assistant (加入 Group)
            if (msg.role === 'tool' || (msg.role === 'assistant' && msg.tool_calls) || (msg.role === 'assistant' && msg.isIntermediate)) {
                // 忽略已废弃的 task plan 消息（如果以前的历史里还有）
                if (msg.tool_calls?.some((tc: any) => tc.function.name === 'set_task_plan')) continue;
                if (msg.tool_name === 'set_task_plan') continue;

                // 完全移除 msg.plan 的检查，因为类型已删除，且我们不再渲染旧的 Plan Card
                // 如果旧的历史数据中包含 plan，它将通过下方的 User/Summary 分支被忽略或渲染为普通文本（如果不符合上述条件）
                // 但实际上，旧的 Plan 消息通常是 assistant role 且带有 plan 属性
                // 我们在这里做一个简单的防御：如果消息既不是 user 也不是 tool，且不是标准的 assistant 文本回复，我们可能需要过滤它
                // 但由于我们删除了 msg.plan 的类型定义，最好的办法是直接忽略它，不尝试访问 plan 属性

                currentStepGroup.push(msg);

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

            // 2. User / Summary (Flush Group 并独立渲染)
            flushGroup(i, true);

            // 再次移除 msg.plan 检查
            // if (msg.plan) continue; <-- DELETED

            // 增加一个额外的防御逻辑：如果这是一个旧的 Plan 消息（特征是没有任何 content 但有 plan），我们不渲染它
            // 由于无法访问 plan 属性，我们通过 content 是否为空来判断，或者直接渲染。
            // 如果旧 Plan 消息 content 为空，renderMessageContent 会返回 null 或是空字符串，渲染出来就是一个空泡泡，影响不大。
            // 为了更干净，我们可以检查 content。
            if (!msg.content && msg.role === 'assistant' && !msg.tool_calls) {
                continue;
            }

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
                        "max-w-full transition-all",
                        msg.role === 'user'
                            ? "bg-primary text-primary-foreground px-4 py-2 rounded-[20px] rounded-tr-none shadow-md text-[14px] font-medium"
                            : "bg-transparent text-foreground/90 py-1 text-[15px] font-medium"
                    )}>
                        {renderMessageContent(msg.content)}
                    </div>
                </div>
            );
        }

        flushGroup(messages.length, false);
        return elements;
    }, [messages, activeModel]);

    return <>{renderContent}</>;
}

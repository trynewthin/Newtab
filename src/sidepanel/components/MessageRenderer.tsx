import { useState, useMemo } from "react";
import { Check, Copy, CheckCheck, Brain } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Message, ModelConfig } from "@/webagent";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MessageRendererProps {
    messages: Message[];
    activeModel?: ModelConfig;
}

/**
 * 复制按钮组件 - 处理剪贴板逻辑与反馈
 */
function CopyButton({ content }: { content: any }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            // 处理复杂内容转纯文本
            let textToCopy = "";
            if (typeof content === 'string') {
                textToCopy = content;
            } else if (Array.isArray(content)) {
                textToCopy = content.map(item => item?.text || (typeof item === 'string' ? item : '')).join('\n');
            } else if (content?.text) {
                textToCopy = content.text;
            }

            if (!textToCopy) return;

            await navigator.clipboard.writeText(textToCopy);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    return (
        <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold text-muted-foreground/40 hover:text-primary hover:bg-primary/5 transition-all mt-1 -ml-1 w-fit group"
        >
            {copied ? (
                <>
                    <CheckCheck size={12} className="text-emerald-500" />
                    <span className="text-emerald-500/80 uppercase tracking-widest">Copied</span>
                </>
            ) : (
                <>
                    <Copy size={11} className="group-hover:scale-110 transition-transform" />
                    <span className="uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Copy</span>
                </>
            )}
        </button>
    );
}

export function MessageRenderer({ messages, activeModel }: MessageRendererProps) {
    /**
     * 辅助渲染：推理思维链块
     */
    const renderReasoningBlock = (reasoning: string) => {
        if (!reasoning) return null;
        return (
            <div className="mb-4 bg-secondary/10 border-l-2 border-primary/20 pl-4 py-2 rounded-r-xl group/reasoning">
                <div className="flex items-center gap-2 mb-1.5 opacity-40 group-hover/reasoning:opacity-60 transition-opacity">
                    <Brain size={12} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Thinking Process</span>
                </div>
                <div className="text-[13.5px] text-muted-foreground/80 italic leading-relaxed ai-content">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {reasoning}
                    </ReactMarkdown>
                </div>
            </div>
        );
    };

    /**
     * 渲染单条消息的内容（支持多模态 + Markdown + 思考提取）
     */
    const renderMessageContent = (content: any, isAi: boolean = false) => {
        if (!content) return null;

        // 处理字符串格式 (支持 Markdown)
        if (typeof content === "string") {
            let displayContent = content;
            let extractedReasoning = "";

            // 🔥 自动解析 <think> 标签 (适配 DeepSeek API 原始返回形式)
            if (isAi && content.includes('<think>') && content.includes('</think>')) {
                // 通常格式是 "" | "thinking..." | "actual content"
                // 但也可能是 "actual" | "thinking" | "actual"
                // 这里的处理逻辑是把第一个 <think> 块提取出来，其余作为正文
                const thinkMatch = content.match(/<think>([\s\S]*?)<\/think>/);
                if (thinkMatch) {
                    extractedReasoning = thinkMatch[1].trim();
                    displayContent = content.replace(/<think>[\s\S]*?<\/think>/, '').trim();
                }
            }

            if (isAi) {
                return (
                    <>
                        {renderReasoningBlock(extractedReasoning)}
                        <div className="prose prose-sm dark:prose-invert max-w-none ai-content">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed text-[15.5px] font-medium tracking-tight opacity-90 text-balance">{children}</p>,
                                    ul: ({ children }) => <ul className="list-disc list-inside mb-3 ml-1 space-y-1.5">{children}</ul>,
                                    ol: ({ children }) => <ol className="list-decimal list-inside mb-3 ml-1 space-y-1.5">{children}</ol>,
                                    li: ({ children }) => <li className="text-[14.5px] leading-snug">{children}</li>,
                                    code: ({ children }) => <code className="bg-secondary/50 px-1.5 py-0.5 rounded-md text-[13px] font-mono border border-border/10 text-primary/80">{children}</code>,
                                    pre: ({ children }) => (
                                        <pre className="bg-secondary/30 p-3 rounded-xl overflow-x-auto my-3 border border-border/20 text-[13px] font-mono shadow-inner scrollbar-none text-foreground/90 font-medium">
                                            {children}
                                        </pre>
                                    ),
                                    h1: ({ children }) => <h1 className="text-xl font-black mb-3 mt-4 tracking-tighter">{children}</h1>,
                                    h2: ({ children }) => <h2 className="text-lg font-bold mb-2 mt-3 tracking-tight">{children}</h2>,
                                    h3: ({ children }) => <h3 className="text-base font-bold mb-1 mt-2">{children}</h3>,
                                    blockquote: ({ children }) => (
                                        <blockquote className="border-l-4 border-primary/30 pl-4 py-1 italic text-muted-foreground my-2 bg-primary/5 rounded-r-lg">
                                            {children}
                                        </blockquote>
                                    ),
                                    table: ({ children }) => <div className="overflow-x-auto my-4"><table className="w-full text-left border-collapse border border-border/20 text-[13px]">{children}</table></div>,
                                    th: ({ children }) => <th className="bg-secondary/40 p-2 border border-border/20 font-bold">{children}</th>,
                                    td: ({ children }) => <td className="p-2 border border-border/20">{children}</td>,
                                }}
                            >
                                {displayContent}
                            </ReactMarkdown>
                        </div>
                    </>
                );
            }
            return <div className="whitespace-pre-wrap leading-relaxed">{content}</div>;
        }

        // 处理数组格式
        if (Array.isArray(content)) {
            return (
                <div className="flex flex-col gap-2">
                    {content.map((item, idx) => {
                        if (!item) return null;
                        if (typeof item === "string") return renderMessageContent(item, isAi);

                        if (item.type === "text") {
                            return (
                                <div key={idx} className={cn(isAi ? "" : "whitespace-pre-wrap leading-relaxed")}>
                                    {isAi ? renderMessageContent(item.text, true) : item.text}
                                </div>
                            );
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
            if (content.type === "text") return renderMessageContent(content.text, isAi);
            if (content.type === "image_url") {
                return <img src={content.image_url.url} className="max-w-[240px] rounded-xl shadow-lg border border-border/10" alt="content" />;
            }
            if (content.text) return renderMessageContent(String(content.text), isAi);
            return <pre className="text-[10px] opacity-50">{JSON.stringify(content, null, 2)}</pre>;
        }

        return String(content);
    };

    /**
     * UI 渲染器
     */
    const renderContent = useMemo(() => {
        const elements: React.ReactNode[] = [];
        let currentStepGroup: any[] = [];

        const flushGroup = (idxKey: number, isFinished: boolean) => {
            if (currentStepGroup.length === 0) return;

            let label = "Thinking...";
            let toolCount = 0;
            let screenshotUrl: string | null = null;
            let isThinking = true;

            currentStepGroup.forEach(m => {
                // 如果有工具调用，以此为准
                if (m.tool_calls) {
                    const name = m.tool_calls[0].function.name;
                    label = name.split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                    toolCount += m.tool_calls.length;
                    isThinking = false;
                }
                // 如果没有工具调用但消息有文本内容，将其视为“思考标题”
                else if (m.role === 'assistant' && typeof m.content === 'string' && m.content.trim() && label === "Thinking...") {
                    label = m.content.trim().split('\n')[0].slice(0, 40);
                    if (label.length >= 40) label += "...";
                }

                if (m.role === 'tool' && typeof m.content === 'string' && m.content.startsWith('IMAGE_DATA:')) {
                    screenshotUrl = m.content.replace('IMAGE_DATA:', '');
                }
            });

            elements.push(
                <div key={`step-group-${idxKey}`} className={cn(
                    "w-full animate-in slide-in-from-left-2 duration-300 my-1",
                    isFinished ? "opacity-50" : "opacity-100"
                )}>
                    <div className="flex items-center justify-between gap-4 py-2 px-1 border-b border-border/10">
                        <div className="flex items-center gap-2 min-w-0">
                            {isThinking && <Brain size={11} className="text-primary/60 shrink-0" />}
                            <span className="text-[11px] font-bold tracking-tight text-muted-foreground truncate uppercase">
                                {label}
                            </span>
                            {toolCount > 1 && (
                                <span className="bg-muted text-[9px] px-1.5 py-0.5 rounded-md text-muted-foreground font-mono">
                                    x{toolCount}
                                </span>
                            )}
                        </div>

                        {isFinished ? (
                            <div className="text-emerald-500/60">
                                <Check size={12} strokeWidth={3} />
                            </div>
                        ) : (
                            <div className="w-3 h-3 border border-primary/20 border-t-primary rounded-full animate-spin shrink-0" />
                        )}
                    </div>

                    {screenshotUrl && (
                        <div className="mt-2 rounded-lg overflow-hidden border border-white/5 opacity-80 hover:opacity-100 transition-opacity max-w-[200px] cursor-zoom-in">
                            <img
                                src={screenshotUrl}
                                alt="Observation"
                                className="w-full h-auto"
                                onClick={() => screenshotUrl && window.open(screenshotUrl, '_blank')}
                            />
                        </div>
                    )}
                </div>
            );
            currentStepGroup = [];
        };

        for (let i = 0; i < messages.length; i++) {
            const msg = messages[i];
            if (!msg) continue;

            if (msg.role === 'tool' || (msg.role === 'assistant' && msg.tool_calls) || (msg.role === 'assistant' && msg.isIntermediate)) {
                if (msg.tool_calls?.some((tc: any) => tc.function.name === 'set_task_plan')) continue;
                if (msg.tool_name === 'set_task_plan') continue;

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

            flushGroup(i, true);

            if (!msg.content && msg.role === 'assistant' && !msg.tool_calls) {
                continue;
            }

            elements.push(
                <div key={`chat-${i}`} className={cn(
                    "flex flex-col gap-1.5 w-full animate-in fade-in slide-in-from-bottom-2 my-2",
                    msg.role === 'user' ? "items-end" : "items-start"
                )}>
                    <div className={cn(
                        "transition-all",
                        msg.role === 'user'
                            ? "max-w-[85%] bg-primary/95 text-primary-foreground px-4 py-2.5 rounded-2xl shadow-sm text-[14px] font-medium"
                            : "max-w-full bg-transparent text-foreground/90 py-1"
                    )}>
                        {/* 思考块支持 (显式 reasoning_content 字段) */}
                        {msg.role === 'assistant' && (msg as any).reasoning_content &&
                            renderReasoningBlock((msg as any).reasoning_content)
                        }

                        {renderMessageContent(msg.content, msg.role === 'assistant')}
                        {msg.role === 'assistant' && !msg.isIntermediate && (
                            <CopyButton content={msg.content} />
                        )}
                    </div>
                </div>
            );
        }

        flushGroup(messages.length, false);
        return elements;
    }, [messages, activeModel]);

    return <>{renderContent}</>;
}

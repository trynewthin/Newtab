import { useState, useMemo } from "react";
import { Check, Copy, CheckCheck, Brain } from "lucide-react";
import { cn } from "@/platform/core/utils";
import { useAiStore, type Message, type ModelConfig } from "@/apps/ai-companion";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MessageRendererProps {
    messages: Message[];
    activeModel?: ModelConfig;
}

/**
 * 复制按钮组件
 */
function CopyButton({ content }: { content: any }) {
    const [copied, setCopied] = useState(false);
    const handleCopy = async () => {
        try {
            let textToCopy = "";
            if (typeof content === 'string') textToCopy = content;
            else if (Array.isArray(content)) {
                textToCopy = content.map(item => item?.text || (typeof item === 'string' ? item : '')).join('\n');
            } else if (content?.text) textToCopy = content.text;

            if (!textToCopy) return;
            await navigator.clipboard.writeText(textToCopy);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) { }
    };

    return (
        <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold text-muted-foreground/40 hover:text-primary hover:bg-primary/5 transition-all mt-1 -ml-1 w-fit group"
        >
            {copied ? (
                <><CheckCheck size={12} className="text-emerald-500" /><span className="text-emerald-500/80 uppercase tracking-widest">Copied</span></>
            ) : (
                <><Copy size={11} className="group-hover:scale-110 transition-transform" /><span className="uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Copy</span></>
            )}
        </button>
    );
}

export function MessageRenderer({ messages, activeModel }: MessageRendererProps) {
    const isLoading = useAiStore(s => s.isLoading);

    const renderReasoningBlock = (reasoning: string) => {
        if (!reasoning) return null;
        return (
            <div className="mb-4 bg-secondary/10 border-l-2 border-primary/20 pl-4 py-2 rounded-r-xl group/reasoning">
                <div className="flex items-center gap-2 mb-1.5 opacity-40 group-hover/reasoning:opacity-60 transition-opacity">
                    <Brain size={12} /><span className="text-[10px] font-black uppercase tracking-widest">Thinking Process</span>
                </div>
                <div className="text-[13.5px] text-muted-foreground/80 italic leading-relaxed ai-content">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{reasoning}</ReactMarkdown>
                </div>
            </div>
        );
    };

    const renderMessageContent = (content: any, isAi: boolean = false) => {
        if (!content) return null;
        if (typeof content === "string") {
            let displayContent = content;
            let extractedReasoning = "";
            if (isAi && content.includes('<think>') && content.includes('</think>')) {
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
                        <div className="prose prose-sm max-w-none ai-content text-black">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed text-[15.5px] font-medium tracking-tight text-black text-balance">{children}</p>,
                                    ul: ({ children }) => <ul className="list-disc list-inside mb-3 ml-1 space-y-1.5">{children}</ul>,
                                    ol: ({ children }) => <ol className="list-decimal list-inside mb-3 ml-1 space-y-1.5">{children}</ol>,
                                    li: ({ children }) => <li className="text-[14.5px] leading-snug">{children}</li>,
                                    code: ({ children }) => <code className="bg-black/5 px-1.5 py-0.5 rounded-md text-[13px] font-mono border border-black/10 text-black/80">{children}</code>,
                                    pre: ({ children }) => (<pre className="bg-black/5 p-3 rounded-xl overflow-x-auto my-3 border border-black/10 text-[13px] font-mono shadow-inner scrollbar-none text-black/85 font-medium">{children}</pre>),
                                    blockquote: ({ children }) => (<blockquote className="border-l-4 border-black/30 pl-4 py-1 italic text-black/70 my-2 bg-black/5 rounded-lg">{children}</blockquote>),
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

        if (Array.isArray(content)) {
            return (
                <div className="flex flex-col gap-2">
                    {content.map((item, idx) => {
                        if (item?.type === "image_url") {
                            return (
                                <div key={idx} className="mt-1 rounded-xl overflow-hidden border border-white/10 shadow-lg max-w-[240px] group transition-all hover:ring-2 hover:ring-primary/20 cursor-zoom-in" onClick={() => window.open(item.image_url.url, '_blank')}>
                                    <img src={item.image_url.url} alt="Browser Frame" className="w-full h-auto group-hover:scale-[1.02] transition-transform duration-300" />
                                </div>
                            );
                        }
                        if (item?.type === "text") return <div key={idx} className={isAi ? "" : "whitespace-pre-wrap leading-relaxed"}>{isAi ? renderMessageContent(item.text, true) : item.text}</div>;
                        return null;
                    })}
                </div>
            );
        }
        return null;
    };

    /**
     * 单个步骤行动渲染组件 - 移除左侧图标，隐藏内容结果
     */
    const ActionLine = ({ label, isFinished, id }: { label: string, isFinished: boolean, id: string }) => (
        <div key={id} className={cn("w-full animate-in slide-in-from-left-2 duration-300 my-0.5", isFinished ? "opacity-50" : "opacity-100")}>
            <div className="flex items-center justify-between gap-4 py-1.5 px-1 border-b border-border/5">
                <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[11px] font-bold tracking-tight text-muted-foreground truncate uppercase">{label}</span>
                </div>
                {!isFinished && isLoading ? (
                    <div className="w-3 h-3 border border-primary/20 border-t-primary rounded-full animate-spin shrink-0" />
                ) : (
                    <div className="text-emerald-500/60"><Check size={12} strokeWidth={3} /></div>
                )}
            </div>
        </div>
    );

    const renderContent = useMemo(() => {
        const elements: React.ReactNode[] = [];

        for (let i = 0; i < messages.length; i++) {
            const msg = messages[i];
            if (!msg) continue;

            const isLast = i === messages.length - 1;
            const isActuallyFinished = !isLast || !isLoading;

            // 特殊逻辑：跳过任务规划工具的视觉展示
            if (msg.tool_calls?.some((tc: any) => tc.function.name === 'set_task_plan') || msg.tool_name === 'set_task_plan') continue;

            // 渲染工具调用 (Assistant 发起)
            if (msg.role === 'assistant' && msg.tool_calls) {
                msg.tool_calls.forEach((tc, idx) => {
                    const label = tc.function.name.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                    elements.push(
                        <ActionLine
                            key={`call-${tc.id}-${idx}`}
                            id={`${tc.id}-${idx}`}
                            label={label}
                            isFinished={isActuallyFinished}
                        />
                    );
                });

                if (msg.content) {
                    elements.push(
                        <div key={`content-${i}`} className="items-start max-w-full bg-transparent text-foreground/90 py-1 my-1">
                            {renderMessageContent(msg.content, true)}
                        </div>
                    );
                }
                continue;
            }

            // 渲染执行结果 (仅保留特殊视觉内容，隐藏文字行)
            if (msg.role === 'tool') {
                const content = msg.content as any;
                if (typeof content === 'object' && content?.__type === 'vision_screenshot') {
                    elements.push(
                        <div key={`screenshot-${i}`} className="mt-1 mb-3 ml-1 rounded-xl overflow-hidden border border-white/10 shadow-lg max-w-[240px] cursor-zoom-in" onClick={() => window.open(content.screenshot, '_blank')}>
                            <img src={content.screenshot} alt="Observation" className="w-full h-auto opacity-80 hover:opacity-100 transition-opacity" />
                        </div>
                    );
                }
                continue;
            }

            // 渲染中间过程消息 (Assistant isIntermediate)
            if (msg.role === 'assistant' && msg.isIntermediate) {
                const label = typeof msg.content === 'string' ? msg.content.trim().split('\n')[0].slice(0, 50) : "Thinking...";
                elements.push(
                    <ActionLine
                        key={`inter-${i}`}
                        id={`inter-${i}`}
                        label={label}
                        isFinished={isActuallyFinished}
                    />
                );
                continue;
            }

            // 正常对话渲染
            if (msg.content || msg.role === 'user') {
                elements.push(
                    <div key={`chat-${i}`} className={cn("flex flex-col gap-1.5 w-full animate-in fade-in slide-in-from-bottom-2 my-2", msg.role === 'user' ? "items-end" : "items-start")}> 
                        <div className={cn(
                            "transition-all px-4 py-2.5 rounded-2xl text-[14px] font-medium",
                            msg.role === 'user'
                                ? "max-w-[85%] bg-black text-white shadow-sm"
                                : "w-full bg-transparent text-black px-0 py-0"
                        )}>
                            {msg.role === 'assistant' && (msg as any).reasoning_content && renderReasoningBlock((msg as any).reasoning_content)}
                            {renderMessageContent(msg.content, msg.role === 'assistant')}
                            {msg.role === 'assistant' && !msg.isIntermediate && <CopyButton content={msg.content} />}
                        </div>
                    </div>
                );
            }
        }

        return elements;
    }, [messages, activeModel, isLoading]);

    return <>{renderContent}</>;
}


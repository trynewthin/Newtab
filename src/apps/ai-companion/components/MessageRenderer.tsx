import { useState, useMemo } from "react";
import { Check, Copy, CheckCheck, Brain } from "lucide-react";
import { cn } from "@/shared/utils";
import { useAiStore, type Message, type ModelConfig } from "@/apps/ai-companion";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useTranslation } from "react-i18next";

interface MessageRendererProps {
    messages: Message[];
    activeModel?: ModelConfig;
}

function CopyButton({ content }: { content: any }) {
    const { t } = useTranslation();
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
            className="group mt-1 -ml-1 flex w-fit items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-semibold text-muted-foreground/60 transition-all hover:bg-foreground/8 hover:text-foreground"
        >
            {copied ? (
                <><CheckCheck size={12} className="text-foreground" /><span className="uppercase tracking-[0.16em] text-foreground/80">{t("copied")}</span></>
            ) : (
                <><Copy size={11} className="transition-transform group-hover:scale-110" /><span className="opacity-0 transition-opacity uppercase tracking-[0.16em] group-hover:opacity-100">{t("copy")}</span></>
            )}
        </button>
    );
}

export function MessageRenderer({ messages, activeModel }: MessageRendererProps) {
    const { t } = useTranslation();
    const isLoading = useAiStore(s => s.isLoading);

    const renderReasoningBlock = (reasoning: string) => {
        if (!reasoning) return null;
        return (
            <div className="group/reasoning mb-4 rounded-r-xl border-l-2 border-border/70 bg-foreground/4 py-2 pl-4">
                <div className="mb-1.5 flex items-center gap-2 opacity-45 transition-opacity group-hover/reasoning:opacity-65">
                    <Brain size={12} /><span className="text-[10px] font-black uppercase tracking-widest">{t("thinking_process")}</span>
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
                        <div className="prose prose-sm dark:prose-invert max-w-none ai-content">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed text-[15.5px] font-medium tracking-tight opacity-90 text-balance">{children}</p>,
                                    ul: ({ children }) => <ul className="list-disc list-inside mb-3 ml-1 space-y-1.5">{children}</ul>,
                                    ol: ({ children }) => <ol className="list-decimal list-inside mb-3 ml-1 space-y-1.5">{children}</ol>,
                                    li: ({ children }) => <li className="text-[14.5px] leading-snug">{children}</li>,
                                    code: ({ children }) => <code className="rounded-md border border-border/60 bg-background/90 px-1.5 py-0.5 font-mono text-[13px] text-foreground/90">{children}</code>,
                                    pre: ({ children }) => (<pre className="my-3 overflow-x-auto rounded-xl border border-border/70 bg-background/90 p-3 font-mono text-[13px] font-medium text-foreground/90 shadow-inner scrollbar-none">{children}</pre>),
                                    blockquote: ({ children }) => (<blockquote className="my-2 rounded-lg border-l-4 border-border/70 bg-foreground/4 py-1 pl-4 italic text-muted-foreground">{children}</blockquote>),
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
                                <div
                                    key={idx}
                                    className="group mt-1 max-w-[240px] cursor-zoom-in overflow-hidden rounded-xl border border-border/70 shadow-lg transition-all hover:ring-2 hover:ring-foreground/20"
                                    onClick={() => window.open(item.image_url.url, '_blank')}
                                >
                                    <img src={item.image_url.url} alt={t("browser_frame")} className="w-full h-auto group-hover:scale-[1.02] transition-transform duration-300" />
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

    const ActionLine = ({ label, isFinished, id }: { label: string, isFinished: boolean, id: string }) => (
        <div key={id} className={cn("w-full animate-in slide-in-from-left-2 duration-300 my-0.5", isFinished ? "opacity-50" : "opacity-100")}>
            <div className="flex items-center justify-between gap-4 py-1.5 px-1 border-b border-border/5">
                <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[11px] font-bold tracking-tight text-muted-foreground truncate uppercase">{label}</span>
                </div>
                {!isFinished && isLoading ? (
                    <div className="h-3 w-3 shrink-0 animate-spin rounded-full border border-foreground/20 border-t-foreground" />
                ) : (
                    <div className="text-foreground/65"><Check size={12} strokeWidth={3} /></div>
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

            if (msg.tool_calls?.some((tc: any) => tc.function.name === 'set_task_plan') || msg.tool_name === 'set_task_plan') continue;

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

            if (msg.role === 'tool') {
                const content = msg.content as any;
                if (typeof content === 'object' && content?.__type === 'vision_screenshot') {
                    elements.push(
                        <div key={`screenshot-${i}`} className="mt-1 mb-3 ml-1 rounded-xl overflow-hidden border border-white/10 shadow-lg max-w-[240px] cursor-zoom-in" onClick={() => window.open(content.screenshot, '_blank')}>
                            <img src={content.screenshot} alt={t("observation")} className="w-full h-auto opacity-80 hover:opacity-100 transition-opacity" />
                        </div>
                    );
                }
                continue;
            }

            if (msg.role === 'assistant' && msg.isIntermediate) {
                const label = typeof msg.content === 'string' ? msg.content.trim().split('\n')[0].slice(0, 50) : t("thinking_default");
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

            if (msg.content || msg.role === 'user') {
                elements.push(
                    <div key={`chat-${i}`} className={cn("flex flex-col gap-1.5 w-full animate-in fade-in slide-in-from-bottom-2 my-2", msg.role === 'user' ? "items-end" : "items-start")}>
                        <div className={cn("transition-all", msg.role === 'user' ? "max-w-[85%] rounded-2xl bg-foreground px-4 py-2.5 text-[14px] font-medium text-background shadow-sm" : "max-w-full bg-transparent py-1 text-foreground/90")}>
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


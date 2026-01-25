import { Download, History, MessageSquarePlus, Trash2, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { useTranslation } from "react-i18next";
import type { Message } from "@/webagent";
import React from "react";

interface HeaderProps {
    messages: Message[];
    sessions: any[];
    currentSessionId: string;
    createSession: () => void;
    deleteSession: (id: string) => void;
    switchSession: (id: string) => void;
    variant?: "solid" | "floating";
    className?: string;
}

export function Header({
    messages,
    sessions,
    currentSessionId,
    createSession,
    deleteSession,
    switchSession,
    variant = "solid",
    className
}: HeaderProps) {
    const { t } = useTranslation();
    const isFloating = variant === "floating";

    const handleExport = () => {
        const data = JSON.stringify(messages, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `debug-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div
            className={cn(
                "flex-none flex items-center justify-between",
                isFloating
                    ? "h-10"
                    : "px-4 py-3 bg-background/80 backdrop-blur-xl sticky top-0 z-50 border-b border-white/5",
                className
            )}
        >
            {/* Title / Brand - Modern Pill Style */}
            <div
                className={cn(
                    "flex items-center gap-2",
                    isFloating
                        ? "h-10 px-3 rounded-full glass-button"
                        : "px-3 py-1.5 bg-secondary/30 rounded-xl border border-white/5 shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                )}
            >
                <MessageSquare size={13} strokeWidth={2.5} className="text-primary" />
                <span className="text-[11px] font-black uppercase tracking-widest text-foreground">
                    {t('sys_ai')}
                </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1">
                {/* Session Manager */}
                <SessionManager
                    sessions={sessions}
                    currentSessionId={currentSessionId}
                    createSession={createSession}
                    deleteSession={deleteSession}
                    switchSession={switchSession}
                    variant={variant}
                />

                {/* Export Button */}
                <button
                    onClick={handleExport}
                    className={cn(
                        "flex items-center justify-center text-muted-foreground/60 hover:text-foreground transition-all",
                        isFloating ? "w-10 h-10 rounded-full glass-button" : "w-8 h-8 rounded-lg hover:bg-secondary"
                    )}
                    title={t('export')}
                >
                    <Download size={15} />
                </button>
            </div>
        </div>
    );
}

interface SessionManagerProps {
    sessions: any[];
    currentSessionId: string;
    createSession: () => void;
    deleteSession: (id: string) => void;
    switchSession: (id: string) => void;
    variant?: "solid" | "floating";
}

function SessionManager({
    sessions,
    currentSessionId,
    createSession,
    deleteSession,
    switchSession,
    variant = "solid"
}: SessionManagerProps) {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = React.useState(false);
    const isFloating = variant === "floating";

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger
                className={cn(
                    "flex items-center justify-center text-muted-foreground/60 hover:text-foreground transition-all",
                    isFloating ? "w-10 h-10 rounded-full glass-button" : "w-8 h-8 rounded-lg hover:bg-secondary"
                )}
            >
                <History size={15} />
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[260px] p-3 bg-background/90 backdrop-blur-xl border-border/50 shadow-2xl rounded-2xl ring-1 ring-black/5">
                <div className="flex items-center justify-between mb-3 px-1">
                    <span className="text-[11px] font-black uppercase text-muted-foreground tracking-widest">{t('sessions')}</span>
                    <span className="text-[10px] text-muted-foreground/50 font-mono">{sessions.length}</span>
                </div>

                <button
                    onClick={() => {
                        createSession();
                        setIsOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-primary text-primary-foreground hover:brightness-110 active:scale-[0.98] transition-all text-xs font-bold mb-3 shadow-lg shadow-primary/20"
                >
                    <MessageSquarePlus size={14} />
                    <span>{t('new_chat')}</span>
                </button>

                <div className="max-h-[280px] overflow-y-auto custom-scrollbar space-y-1 pr-1">
                    {sessions.map(s => (
                        <div
                            key={s.id}
                            onClick={() => {
                                switchSession(s.id);
                                setIsOpen(false);
                            }}
                            className={cn(
                                "group cursor-pointer flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-xs transition-all border border-transparent",
                                currentSessionId === s.id
                                    ? "bg-secondary text-foreground border-border/50 shadow-sm"
                                    : "hover:bg-secondary/50 text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                                <span className={cn("truncate font-medium", currentSessionId === s.id && "font-bold")}>
                                    {typeof s.title === 'string' ? s.title : t('new_conversation')}
                                </span>
                                <span className="text-[9px] text-muted-foreground/40 font-mono">
                                    {new Date(s.updatedAt || Date.now()).toLocaleDateString()}
                                </span>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    deleteSession(s.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                            >
                                <Trash2 size={12} />
                            </button>
                        </div>
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    );
}

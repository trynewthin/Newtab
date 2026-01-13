import { Download, History, MessageSquarePlus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import type { Message } from "@/webagent";
import React from "react";

interface HeaderProps {
    activeTab: 'chat' | 'config' | 'preferences';
    setActiveTab: (tab: 'chat' | 'config' | 'preferences') => void;
    messages: Message[];
    sessions: any[];
    currentSessionId: string;
    createSession: () => void;
    deleteSession: (id: string) => void;
    switchSession: (id: string) => void;
}

export function Header({
    activeTab,
    setActiveTab,
    messages,
    sessions,
    currentSessionId,
    createSession,
    deleteSession,
    switchSession
}: HeaderProps) {
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
        <div className="flex-none flex items-center justify-between px-4 py-3 border-b border-border/40 bg-background/50 backdrop-blur-md sticky top-0 z-10">
            {/* Tab Switcher */}
            <div className="flex bg-secondary/50 p-1 rounded-xl">
                {(['chat', 'config', 'preferences'] as const).map(t => (
                    <button
                        key={t}
                        onClick={() => setActiveTab(t)}
                        className={cn(
                            "px-4 py-1.5 text-[11px] font-bold rounded-lg transition-all uppercase tracking-widest",
                            activeTab === t
                                ? "bg-background text-primary shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        {t.slice(0, 4)}
                    </button>
                ))}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1">
                {/* Export Button */}
                <button
                    onClick={handleExport}
                    className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
                    title="Export Messages"
                >
                    <Download size={15} />
                </button>

                {/* Session Manager */}
                {activeTab === 'chat' && (
                    <SessionManager
                        sessions={sessions}
                        currentSessionId={currentSessionId}
                        createSession={createSession}
                        deleteSession={deleteSession}
                        switchSession={switchSession}
                    />
                )}
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
}

function SessionManager({
    sessions,
    currentSessionId,
    createSession,
    deleteSession,
    switchSession
}: SessionManagerProps) {
    const [isOpen, setIsOpen] = React.useState(false);

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
                <History size={15} />
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[240px] p-2 bg-background/95 backdrop-blur-xl border-border/50 shadow-2xl rounded-2xl">
                <button
                    onClick={() => {
                        createSession();
                        setIsOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-all text-xs font-bold mb-2"
                >
                    <MessageSquarePlus size={14} />
                    <span>New Chat</span>
                </button>
                <div className="max-h-[300px] overflow-y-auto space-y-1">
                    {sessions.map(s => (
                        <div
                            key={s.id}
                            onClick={() => {
                                switchSession(s.id);
                                setIsOpen(false);
                            }}
                            className={cn(
                                "group flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs cursor-pointer",
                                currentSessionId === s.id
                                    ? "bg-secondary text-foreground"
                                    : "hover:bg-muted text-muted-foreground"
                            )}
                        >
                            <span className="truncate flex-1 font-medium">
                                {typeof s.title === 'string' ? s.title : "New Chat"}
                            </span>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    deleteSession(s.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:text-destructive"
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

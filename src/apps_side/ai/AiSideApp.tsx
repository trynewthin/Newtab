import { useEffect } from "react";
import { useAiStore, useAiChat } from "@/webagent";
import { ChatView, ChatInput } from "@/apps_side/ai/components";
import { useSettingsStore } from "@/store/modules/settings";
import "@/lib/i18n/i18n"; // Ensure i18n is initialized
import { BaseSidePage } from "@/apps_side/core/BaseSidePage";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { History, Menu, MessageSquarePlus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

function AiSideApp() {
    const messages = useAiStore(s => s.messages);
    const models = useAiStore(s => s.models);
    const activeModelId = useAiStore(s => s.activeModelId);
    const setActiveModel = useAiStore(s => s.setActiveModel);
    const sessions = useAiStore(s => s.sessions);
    const currentSessionId = useAiStore(s => s.currentSessionId || "");
    const createSession = useAiStore(s => s.createSession);
    const deleteSession = useAiStore(s => s.deleteSession);
    const switchSession = useAiStore(s => s.switchSession);
    const hydrateSession = useAiStore(s => s.hydrateSession);
    const isRestoring = useAiStore(s => s.isRestoring);

    const { theme, primaryColor } = useSettingsStore();

    const activeModel = models.find(m => m.id === activeModelId);

    const { sendMessage, stopGeneration, isLoading } = useAiChat();

    const handleExport = () => {
        const data = JSON.stringify(messages, null, 2);
        const blob = new Blob([data], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `debug-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    useEffect(() => {
        hydrateSession();
    }, []);

    useEffect(() => {
        const root = window.document.documentElement;

        root.classList.remove("light", "dark");
        if (theme === "system") {
            const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
            root.classList.add(systemTheme);
        } else {
            root.classList.add(theme);
        }

        if (primaryColor) {
            root.style.setProperty("--primary", primaryColor);
        }
    }, [theme, primaryColor]);

    return (
        <BaseSidePage
            floatingPreset="header"
            appName="AI Assistant"
            floatingHeader={
                <div className="w-full flex items-center justify-end gap-2">
                    <Popover>
                        <PopoverTrigger
                            className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all bg-white/70 dark:bg-black/60 border border-black/10 dark:border-white/10"
                            title="话题管理"
                        >
                            <History size={16} className="text-black/70 dark:text-white/70" />
                        </PopoverTrigger>
                        <PopoverContent align="end" className="w-[260px] p-3 bg-white/85 dark:bg-black/80 backdrop-blur-xl border border-black/10 dark:border-white/10 shadow-2xl rounded-2xl ring-1 ring-black/5 dark:ring-white/10">
                            <button
                                onClick={createSession}
                                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-black text-white dark:bg-white dark:text-black hover:opacity-90 active:scale-[0.98] transition-all text-xs font-bold mb-3 shadow-lg shadow-black/10 dark:shadow-white/10"
                            >
                                <MessageSquarePlus size={14} />
                                <span>新建话题</span>
                            </button>
                            <div className="max-h-[280px] overflow-y-auto custom-scrollbar space-y-1 pr-1">
                                {sessions.map(s => (
                                    <div
                                        key={s.id}
                                        onClick={() => switchSession(s.id)}
                                        className={cn(
                                            "group cursor-pointer flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-xs transition-all border border-transparent",
                                            currentSessionId === s.id
                                                ? "bg-black/5 dark:bg-white/10 text-black dark:text-white border-black/10 dark:border-white/10 shadow-sm"
                                                : "hover:bg-black/5 dark:hover:bg-white/10 text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white"
                                        )}
                                    >
                                        <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                                            <span className={cn("truncate font-medium", currentSessionId === s.id && "font-bold")}>
                                                {typeof s.title === "string" ? s.title : "新会话"}
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
                                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white transition-all"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </PopoverContent>
                    </Popover>

                    <Popover>
                        <PopoverTrigger
                            className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all bg-white/70 dark:bg-black/60 border border-black/10 dark:border-white/10"
                            title="更多菜单"
                        >
                            <Menu size={16} className="text-black/70 dark:text-white/70" />
                        </PopoverTrigger>
                        <PopoverContent align="end" className="w-[200px] p-2 bg-white/85 dark:bg-black/80 backdrop-blur-xl border border-black/10 dark:border-white/10 shadow-2xl rounded-2xl ring-1 ring-black/5 dark:ring-white/10">
                            <button
                                onClick={handleExport}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-black/70 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/10 hover:text-black dark:hover:text-white transition-all"
                            >
                                导出会话记录
                            </button>
                        </PopoverContent>
                    </Popover>
                </div>
            }
            floating={
                <div className="absolute inset-x-0 bottom-0 p-3 pt-0">
                    <ChatInput
                        models={models}
                        activeModelId={activeModelId}
                        activeModel={activeModel}
                        setActiveModel={setActiveModel}
                        isLoading={isLoading || isRestoring}
                        onSend={sendMessage}
                        onStop={stopGeneration}
                    />
                </div>
            }
            background={<div className="absolute inset-0 bg-white dark:bg-black" />}
            content={
                <div className="flex flex-col h-full bg-transparent text-black">
                    <div className="flex-1 overflow-hidden relative">
                        {isRestoring ? (
                            <div className="flex items-center justify-center h-full text-muted-foreground animate-pulse">
                                Loading history...
                            </div>
                        ) : (
                            <ChatView
                                messages={messages}
                                activeModel={activeModel}
                                isLoading={isLoading}
                                className={messages.length === 0 ? "pt-20 pb-28" : "pt-2 pb-28"}
                            />
                        )}
                    </div>
                </div>
            }
        />
    );
}

export default AiSideApp;

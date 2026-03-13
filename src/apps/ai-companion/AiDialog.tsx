import { useEffect, useMemo } from "react";
import { AppModalV1, AppModalV1EmptyState } from "@/components/modal/AppModalV1";
import { useTranslation } from "react-i18next";
import { MessageSquare, Plus, Trash2, Sparkles } from "lucide-react";
import { useAiStore, useAiChat } from "@/apps/ai-companion";
import { ChatView } from "./components/ChatView";
import { ChatInput } from "./components/ChatInput";
import { PlanPanel } from "./components/PlanPanel";

interface AiDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AiDialog({ open, onOpenChange }: AiDialogProps) {
    const { t } = useTranslation();
    const {
        sessions,
        currentSessionId,
        messages,
        isLoading,
        hydrateSession,
        createSession,
        switchSession,
        deleteSession,
        models,
        activeModelId,
        setActiveModel,
        getActiveModelConfig
    } = useAiStore();

    const { sendMessage, stopGeneration } = useAiChat();

    useEffect(() => {
        if (open) {
            hydrateSession();
        }
    }, [open, hydrateSession]);

    const activeModel = getActiveModelConfig();

    // ─── Sidebar: session list with delete actions ───────────────────
    const sidebarItems = useMemo(() =>
        sessions.map(session => ({
            id: session.id,
            icon: MessageSquare,
            label: session.title || t('new_conversation'),
            actions: sessions.length > 1 ? (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        deleteSession(session.id);
                    }}
                    className="rounded-md p-1 text-muted-foreground transition-all hover:bg-foreground/8 hover:text-foreground"
                >
                    <Trash2 size={11} />
                </button>
            ) : undefined,
        })),
        [sessions, t, deleteSession]
    );

    // ─── Header: model name centered ─────────────────────────────────
    const headerContent = (
        <div className="flex items-center justify-center gap-1.5 flex-1 min-w-0">
            <Sparkles size={12} className="text-foreground/60 shrink-0" />
            <span className="text-[11px] font-semibold text-foreground/70 truncate">
                {activeModel?.name || t('ai_ready')}
            </span>
        </div>
    );

    return (
        <AppModalV1
            open={open}
            onOpenChange={onOpenChange}
            header={headerContent}
            headerActions={
                <button
                    type="button"
                    onClick={() => createSession()}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                    title={t('new_chat')}
                >
                    <Plus size={14} strokeWidth={2.5} />
                </button>
            }
            sidebarItems={sidebarItems}
            sidebarActiveId={currentSessionId || undefined}
            onSidebarChange={(id) => switchSession(id)}
            floatLayer={
                <div className="absolute bottom-0 inset-x-0 pointer-events-auto px-4 pb-4 pt-2">
                    <div className="max-w-4xl mx-auto w-full">
                        <PlanPanel />
                        <ChatInput
                            models={models}
                            activeModelId={activeModelId}
                            activeModel={activeModel}
                            setActiveModel={setActiveModel}
                            isLoading={isLoading}
                            onSend={sendMessage}
                            onStop={stopGeneration}
                        />
                    </div>
                </div>
            }
        >
            {messages.length === 0 && !isLoading && (
                <AppModalV1EmptyState
                    icon={Sparkles}
                    message={activeModel?.name || t('ai_ready')}
                />
            )}
            <ChatView
                messages={messages}
                activeModel={activeModel}
                isLoading={isLoading}
            />
            {/* Spacer for floating ChatInput */}
            <div className="h-16 shrink-0" />
        </AppModalV1>
    );
}


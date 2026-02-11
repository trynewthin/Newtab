import { useEffect, useState } from "react";
import { AppModal, Sidebar, SidebarItem, SidebarHeader } from "@/platform/shared/components";
import { useTranslation } from "react-i18next";
import { MessageSquare, Plus, Trash2, Bot } from "lucide-react";
import { useAiStore, useAiChat } from "@/apps/ai-companion";
import { ChatView } from "./components/ChatView";
import { ChatInput } from "./components/ChatInput";
import { cn } from "@/platform/core/utils";

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

    // Default to collapsed as requested
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
    const [showMobileMenu, setShowMobileMenu] = useState(false);

    useEffect(() => {
        if (open) {
            hydrateSession();
        }
    }, [open, hydrateSession]);

    const activeModel = getActiveModelConfig();


    return (
        <AppModal
            open={open}
            onOpenChange={onOpenChange}
            isCollapsed={isSidebarCollapsed}
            showMobileMenu={showMobileMenu}
            onCloseMobileMenu={() => setShowMobileMenu(false)}
            sidebar={
                <Sidebar
                    title={t('sessions')}
                    isCollapsed={isSidebarCollapsed}
                    onCollapseChange={setIsSidebarCollapsed}
                    showMobileMenu={showMobileMenu}
                    onCloseMobileMenu={() => setShowMobileMenu(false)}
                    footer={
                        <div className="flex flex-col gap-2">
                            <button
                                onClick={createSession}
                                className={cn(
                                    "flex items-center justify-center gap-2 rounded-xl transition-all active:scale-95 shadow-sm border",
                                    "bg-primary text-primary-foreground border-primary/20",
                                    isSidebarCollapsed && !showMobileMenu ? "w-10 h-10 mx-auto" : "w-full h-11 px-4 text-xs font-bold uppercase tracking-wider"
                                )}
                                title={t('new_chat')}
                            >
                                <Plus size={isSidebarCollapsed && !showMobileMenu ? 20 : 16} strokeWidth={3} />
                                {!(isSidebarCollapsed && !showMobileMenu) && <span>{t('new_chat')}</span>}
                            </button>
                        </div>
                    }
                >
                    {sessions.map(session => (
                        <SidebarItem
                            key={session.id}
                            icon={MessageSquare}
                            label={session.title || t('new_conversation')}
                            isActive={currentSessionId === session.id}
                            onClick={() => {
                                switchSession(session.id);
                                setShowMobileMenu(false);
                            }}
                            actions={
                                sessions.length > 1 && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteSession(session.id);
                                        }}
                                        className="p-1 px-1.5 rounded-md hover:bg-destructive/10 hover:text-destructive transition-all"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                )
                            }
                        />
                    ))}
                </Sidebar>
            }
            header={
                <SidebarHeader
                    title={t('sys_ai') || "AI Assistant"}
                    icon={Bot}
                    description={activeModel?.name || t('ai_ready')}
                    onMenuClick={() => setShowMobileMenu(true)}
                    onClose={() => onOpenChange(false)}
                    className="border-b-0"
                />
            }
            footer={
                <div className="p-6">
                    <div className="max-w-4xl mx-auto w-full">
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
            <ChatView
                messages={messages}
                activeModel={activeModel}
                isLoading={isLoading}
                className="pt-4 pb-4"
            />
        </AppModal>
    );
}


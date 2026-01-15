import { useState, useEffect } from "react";
import { useAiStore, useAiChat } from "@/webagent";
import { Header, ChatView, ChatInput } from "./components";
import { ToolTester } from "./components/ToolTester";
import "@/lib/i18n"; // Ensure i18n is initialized

function App() {
    // Store selectors
    const messages = useAiStore(s => s.messages);
    const models = useAiStore(s => s.models);
    const activeModelId = useAiStore(s => s.activeModelId);
    const setActiveModel = useAiStore(s => s.setActiveModel);
    const sessions = useAiStore(s => s.sessions);
    const currentSessionId = useAiStore(s => s.currentSessionId || ""); // Ensure string fallback
    const createSession = useAiStore(s => s.createSession);
    const deleteSession = useAiStore(s => s.deleteSession);
    const switchSession = useAiStore(s => s.switchSession);
    const hydrateSession = useAiStore(s => s.hydrateSession);
    const isRestoring = useAiStore(s => s.isRestoring);

    // Derived state
    const activeModel = models.find(m => m.id === activeModelId);

    // Chat hook
    const { sendMessage, stopGeneration, isLoading } = useAiChat();

    // Local state - removed 'config' and 'preferences' tabs
    const [activeTab, setActiveTab] = useState<'chat' | 'test'>('chat');

    // 1. Initialize DB Connection
    useEffect(() => {
        hydrateSession();
    }, []);

    return (
        <div className="w-full h-screen bg-background text-foreground flex flex-col font-sans select-none overflow-hidden text-[13px]">
            {/* Header */}
            <Header
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                messages={messages}
                sessions={sessions}
                currentSessionId={currentSessionId}
                createSession={createSession}
                deleteSession={deleteSession}
                switchSession={switchSession}
            />

            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden relative">
                {activeTab === 'chat' ? (
                    isRestoring ? (
                        <div className="flex items-center justify-center h-full text-muted-foreground animate-pulse">
                            Loading history...
                        </div>
                    ) : (
                        <ChatView
                            messages={messages}
                            activeModel={activeModel}
                            isLoading={isLoading}
                        />
                    )
                ) : activeTab === 'test' ? (
                    <div className="h-full overflow-y-auto">
                        <ToolTester />
                    </div>
                ) : null}
            </div>

            {/* Chat Input (only visible in chat tab) */}
            {activeTab === 'chat' && (
                <ChatInput
                    models={models}
                    activeModelId={activeModelId}
                    activeModel={activeModel}
                    setActiveModel={setActiveModel}
                    isLoading={isLoading || isRestoring}
                    onSend={sendMessage}
                    onStop={stopGeneration}
                />
            )}
        </div>
    );
}

export default App;

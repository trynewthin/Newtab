import { useState } from "react";
import { useAiStore, useAiChat } from "@/webagent";
import { AiConfigTab } from "@/components/items/ai/AiConfigTab";
import { AiPreferencesTab } from "@/components/items/ai/AiPreferencesTab";
import { Header, ChatView, ChatInput } from "./components";

function App() {
    // Store selectors
    const messages = useAiStore(s => s.messages);
    const models = useAiStore(s => s.models);
    const activeModelId = useAiStore(s => s.activeModelId);
    const setActiveModel = useAiStore(s => s.setActiveModel);
    const sessions = useAiStore(s => s.sessions);
    const currentSessionId = useAiStore(s => s.currentSessionId);
    const createSession = useAiStore(s => s.createSession);
    const deleteSession = useAiStore(s => s.deleteSession);
    const switchSession = useAiStore(s => s.switchSession);

    // Derived state
    const activeModel = models.find(m => m.id === activeModelId);

    // Chat hook
    const { sendMessage, stopGeneration, isLoading } = useAiChat();

    // Local state
    const [activeTab, setActiveTab] = useState<'chat' | 'config' | 'preferences'>('chat');

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
                    <ChatView
                        messages={messages}
                        activeModel={activeModel}
                        isLoading={isLoading}
                    />
                ) : activeTab === 'config' ? (
                    <div className="h-full overflow-y-auto p-4">
                        <AiConfigTab />
                    </div>
                ) : (
                    <div className="h-full overflow-y-auto p-4">
                        <AiPreferencesTab />
                    </div>
                )}
            </div>

            {/* Chat Input (only visible in chat tab) */}
            {activeTab === 'chat' && (
                <ChatInput
                    models={models}
                    activeModelId={activeModelId}
                    activeModel={activeModel}
                    setActiveModel={setActiveModel}
                    isLoading={isLoading}
                    onSend={sendMessage}
                    onStop={stopGeneration}
                />
            )}
        </div>
    );
}

export default App;

import { useEffect } from "react";
import { useAiStore, useAiChat } from "@/webagent";
import { Header, ChatView, ChatInput } from "./components";
import { useSettingsStore } from "@/store/modules/settings";
import "@/lib/i18n/i18n"; // Ensure i18n is initialized

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

    // AI Store Settings
    const { theme, primaryColor, backgroundConfig } = useSettingsStore();

    // Derived state
    const activeModel = models.find(m => m.id === activeModelId);

    // Chat hook
    const { sendMessage, stopGeneration, isLoading } = useAiChat();

    // 1. Initialize DB Connection
    useEffect(() => {
        hydrateSession();
    }, []);

    // 2. Global Theme Application
    useEffect(() => {
        const root = window.document.documentElement;

        // Apply Light/Dark Mode
        root.classList.remove("light", "dark");
        if (theme === "system") {
            const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
            root.classList.add(systemTheme);
        } else {
            root.classList.add(theme);
        }

        // Apply Primary Color
        if (primaryColor) {
            root.style.setProperty('--primary', primaryColor);
        }
    }, [theme, primaryColor]);

    const getBgStyle = () => {
        if (backgroundConfig.type === 'image') {
            return {
                backgroundImage: `url(${backgroundConfig.value})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            } as React.CSSProperties;
        }
        if (backgroundConfig.type === 'gradient') {
            return {
                backgroundImage: backgroundConfig.value,
            } as React.CSSProperties;
        }
        if (backgroundConfig.type === 'solid') {
            return {
                backgroundColor: backgroundConfig.value,
            } as React.CSSProperties;
        }
        return {};
    };

    return (
        <div className="w-full h-screen relative font-sans select-none overflow-hidden text-[13px]">
            {/* Background Layer (Mirrors main app background) */}
            <div
                className="absolute inset-0 z-0 transition-all duration-500"
                style={getBgStyle()}
            />
            {/* Glass Overlay for sidepanel feel */}
            <div className="absolute inset-0 z-0 bg-background/60 backdrop-blur-3xl" />

            {/* Content container */}
            <div className="relative z-10 flex flex-col h-full bg-transparent text-foreground">
                {/* Header */}
                <Header
                    messages={messages}
                    sessions={sessions}
                    currentSessionId={currentSessionId}
                    createSession={createSession}
                    deleteSession={deleteSession}
                    switchSession={switchSession}
                />

                {/* Main Content Area */}
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
                        />
                    )}
                </div>

                {/* Chat Input */}
                <div className="p-3 pt-0">
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
            </div>
        </div>
    );
}

export default App;

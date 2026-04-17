import { useEffect, useLayoutEffect } from "react";
import { useStorageConnection } from "@/platform/persistence/sync";
import { useSettingsStore } from "@/apps/settings";
import { AppRouter } from "./AppRouter";
import { BackgroundLayer } from "./layers/BackgroundLayer";
import { FloatLayer } from "./layers/FloatLayer";
import { ModalLayer } from "./layers/ModalLayer";
import { Toaster } from "@/components/ui/sonner";
import { HashRouter } from "react-router-dom";
import { useUIStore } from "@/launcher/store/ui.store";
import { cn } from "@/shared/utils";
import { LAYER_Z_INDEX } from "@/shared/constants/layerZIndex";

function syncThemeToDOM() {
    const root = window.document.documentElement;
    const theme = useSettingsStore.getState().theme;
    root.classList.remove("light", "dark");
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    root.classList.add(theme === "system" ? systemTheme : theme);
}

export function App() {
    // 监听 LocalStorage 变化并同步状态 (解决 Popup 修改后 Newtab 不刷新问题)
    useStorageConnection();

    // 同步主题到 documentElement，使 .dark 选择器生效（如 modal-minimal-scope）
    const theme = useSettingsStore((state) => state.theme);
    useLayoutEffect(syncThemeToDOM, [theme]);
    useEffect(() => {
        // 确保 persist hydration 完成后也同步一次
        return useSettingsStore.persist.onFinishHydration(syncThemeToDOM);
    }, []);

    const activeSystemDialog = useUIStore((state) => state.activeSystemDialog);
    const isModalVisible = activeSystemDialog !== null;

    return (
        <HashRouter>
            <div className="relative w-full h-full overflow-hidden">
                <BackgroundLayer />
                <div
                    style={{ zIndex: LAYER_Z_INDEX.newtabContent }}
                    className={cn(
                        "relative w-full h-full transition-opacity duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                        isModalVisible && "pointer-events-none"
                    )}
                >
                    <AppRouter />
                </div>
                <div
                    className={cn(
                        "transition-opacity duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                        isModalVisible && "pointer-events-none"
                    )}
                >
                    <FloatLayer />
                </div>
                <ModalLayer />
                <Toaster />
            </div>
        </HashRouter>
    );
}

export default App;


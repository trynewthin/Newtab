import { useEffect, useLayoutEffect } from "react";
import { useStorageConnection } from "@/platform/persistence/sync";
import {
    applyThemePreferenceToDOM,
    useLanguagePreferenceStore,
    useThemePreferenceStore,
} from "@/config";
import { applyLanguagePreferenceToI18n } from "@/platform/i18n";
import { AppRouter } from "./AppRouter";
import { BackgroundLayer } from "./layers/BackgroundLayer";
import { FloatLayer } from "./layers/FloatLayer";
import { ModalLayer } from "./layers/ModalLayer";
import { Toaster } from "@/components/ui/sonner";
import { HashRouter, useLocation } from "react-router-dom";
import { useUIStore } from "@/launcher/store";
import { cn } from "@/shared/utils";
import { NEWTAB_LAYER_Z_INDEX } from "@/shared/constants/layerZIndex";
import { parseSystemDialogRoute, useSystemDialogRouter } from "@/launcher/store";

function syncThemeToDOM() {
    applyThemePreferenceToDOM(useThemePreferenceStore.getState().theme);
}

function syncLanguageToI18n() {
    void applyLanguagePreferenceToI18n(useLanguagePreferenceStore.getState().language);
}

function AppShell() {
    // 监听 LocalStorage 变化并同步状态 (解决 Popup 修改后 Newtab 不刷新问题)
    useStorageConnection();
    useSystemDialogRouter();

    // 同步主题到 documentElement，使 .dark 选择器生效（如 modal-minimal-scope）
    const theme = useThemePreferenceStore((state) => state.theme);
    const language = useLanguagePreferenceStore((state) => state.language);
    useLayoutEffect(syncThemeToDOM, [theme]);
    useEffect(syncLanguageToI18n, [language]);
    useEffect(() => {
        // 确保 persist hydration 完成后也同步一次
        return useThemePreferenceStore.persist.onFinishHydration(syncThemeToDOM);
    }, []);
    useEffect(() => {
        return useLanguagePreferenceStore.persist.onFinishHydration(syncLanguageToI18n);
    }, []);

    const activeSystemDialog = useUIStore((state) => state.activeSystemDialog);
    const isModalVisible = activeSystemDialog !== null;
    const location = useLocation();
    const isModalRoute = parseSystemDialogRoute(location.pathname) !== null;

    return (
        <div className="relative w-full h-full overflow-hidden">
            <BackgroundLayer />
            {!isModalRoute ? (
                <>
                    <div
                        style={{ zIndex: NEWTAB_LAYER_Z_INDEX.content }}
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
                </>
            ) : null}
            <ModalLayer />
            <Toaster />
        </div>
    );
}

export function App() {
    return (
        <HashRouter>
            <AppShell />
        </HashRouter>
    );
}

export default App;

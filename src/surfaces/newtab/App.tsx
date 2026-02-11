import { useStorageConnection } from "@/platform/state/persistence/sync";
import { AppRouter } from "./AppRouter";
import { BackgroundLayer } from "./layers/BackgroundLayer";
import { FloatLayer } from "./layers/FloatLayer";
import { ModalLayer } from "./layers/ModalLayer";
import { Toaster } from "@/platform/shared/ui/sonner";
import { HashRouter } from "react-router-dom";
import { useUIStore } from "@/apps/launcher/store/ui";
import { cn } from "@/platform/core/utils";

export function App() {
    // 监听 LocalStorage 变化并同步状态 (解决 Popup 修改后 Newtab 不刷新问题)
    useStorageConnection();
    const activeSystemDialog = useUIStore((state) => state.activeSystemDialog);
    const isModalVisible = activeSystemDialog !== null;

    return (
        <HashRouter>
            <div className="relative w-full h-full overflow-hidden">
                <BackgroundLayer />
                <div
                    className={cn(
                        "relative z-10 w-full h-full transition-opacity duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                        isModalVisible && "opacity-0 pointer-events-none"
                    )}
                >
                    <AppRouter />
                </div>
                <div
                    className={cn(
                        "transition-opacity duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                        isModalVisible && "opacity-0 pointer-events-none"
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


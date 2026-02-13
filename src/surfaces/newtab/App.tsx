import { useStorageConnection } from "@/state/persistence/sync";
import { AppRouter } from "./AppRouter";
import { BackgroundLayer } from "./layers/BackgroundLayer";
import { FloatLayer } from "./layers/FloatLayer";
import { ModalLayer } from "./layers/ModalLayer";
import { Toaster } from "@/components/ui/sonner";
import { HashRouter } from "react-router-dom";
import { useUIStore } from "@/launcher/store/ui";
import { cn } from "@/core/utils";
import { LAYER_Z_INDEX } from "@/core/layerZIndex";

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


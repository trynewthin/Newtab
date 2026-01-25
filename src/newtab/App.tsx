import { useStorageConnection } from "@/store/persistence/sync";
import { AppRouter } from "./AppRouter";
import { BackgroundLayer } from "./layers/BackgroundLayer";
import { FloatLayer } from "./layers/FloatLayer";
import { Toaster } from "@/shared/ui/sonner";

export function App() {
    // 监听 LocalStorage 变化并同步状态 (解决 Popup 修改后 Newtab 不刷新问题)
    useStorageConnection();

    return (
        <div className="relative w-full h-full overflow-hidden">
            <BackgroundLayer />
            <div className="relative z-10 w-full h-full">
                <AppRouter />
            </div>
            <FloatLayer />
            <Toaster />
        </div>
    );
}

export default App;

import { useStorageConnection } from "@/store/persistence/sync";
import { BackgroundLayer } from "./layers/BackgroundLayer";
import { ContentLayer } from "./layers/ContentLayer";
import { FloatLayer } from "./layers/FloatLayer";

export function App() {
    // 监听 LocalStorage 变化并同步状�?(解决 Popup 修改�?Newtab 不刷新问�?
    useStorageConnection();

    return (
        <div className="relative w-full h-full overflow-hidden">
            <BackgroundLayer />
            <ContentLayer />
            <FloatLayer />
        </div>
    );
}

export default App;

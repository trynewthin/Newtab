import { useStorageConnection } from "@/store/persistence/sync";
import { BackgroundLayer } from "./layers/BackgroundLayer";
import { ContentLayer } from "./layers/ContentLayer";
import { FloatLayer } from "./layers/FloatLayer";

export function App() {
    // 鐩戝惉 LocalStorage 鍙樺寲骞跺悓姝ョ姸鎬?(瑙ｅ喅 Popup 淇敼鍚?Newtab 涓嶅埛鏂伴棶棰?
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

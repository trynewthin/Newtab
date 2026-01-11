import { useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { BackgroundLayer } from "./layers/BackgroundLayer";
import { ContentLayer } from "./layers/ContentLayer";
import { FloatLayer } from "./layers/FloatLayer";

export function App() {
    // 监听 Chrome Storage 变化并同步状态 (解决 Popup 修改后 Newtab 不刷新问题)
    useEffect(() => {
        const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
            if (areaName === 'local' && changes['app-storage']) {
                // 当检测到 app-storage 变化时，仅仅调用 rehydrate 可能不够（因为是指针/缓存问题）
                // 更可靠的方式是直接通过 Zustand 的 persist API 重新从 Storage 读取
                useAppStore.persist.rehydrate();
            }
        };

        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.onChanged.addListener(handleStorageChange);
        }

        return () => {
            if (typeof chrome !== 'undefined' && chrome.storage) {
                chrome.storage.onChanged.removeListener(handleStorageChange);
            }
        };
    }, []);

    return (
        <div className="relative w-full h-full overflow-hidden">
            <BackgroundLayer />
            <ContentLayer />
            <FloatLayer />
        </div>
    );
}

export default App;
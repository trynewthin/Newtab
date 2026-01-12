import { useEffect } from "react";
import { useTagStore } from "@/store/modules/tag";
import { useTodoStore } from "@/store/modules/todo";
import { usePomodoroStore } from "@/store/modules/pomodoro";
import { useSettingsStore } from "@/store/modules/settings";
import { useUIStore } from "@/store/modules/ui";
import { BackgroundLayer } from "./layers/BackgroundLayer";
import { ContentLayer } from "./layers/ContentLayer";
import { FloatLayer } from "./layers/FloatLayer";

export function App() {
    // 监听 LocalStorage 变化并同步状态 (解决 Popup 修改后 Newtab 不刷新问题)
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            // 当其他窗口/Popup 修改了 localStorage 时触发
            if (e.key === 'app-tags') useTagStore.persist.rehydrate();
            if (e.key === 'app-todos') useTodoStore.persist.rehydrate();
            if (e.key === 'app-pomodoro') usePomodoroStore.persist.rehydrate();
            if (e.key === 'app-settings') useSettingsStore.persist.rehydrate();
            if (e.key === 'app-ui') useUIStore.persist.rehydrate();
        };

        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
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
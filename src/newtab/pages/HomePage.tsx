import { SearchBar } from "@/components/home/search/SearchBar";
import { BasePage } from "@/components/common";
import { TagGrid } from "@/components/items/tag";
import { LiveActivityArea } from "@/components/home/live/LiveActivityArea";
import { PomodoroLiveActivity } from "@/components/items/pomodoro/PomodoroDialog";
import { TodoLiveActivity } from "@/components/items/todo/TodoDialog";
import { usePomodoroStore } from "@/store/modules/pomodoro";
import { useTodoStore } from "@/store/modules/todo";
import { cn } from "@/lib/utils";
import { HomeTools } from "@/components/home/tools/HomeTools";

export function HomePage() {
    const isPomodoroRunning = usePomodoroStore(s => s.status.isRunning);
    const pendingTodosCount = useTodoStore(s => s.todos.filter(t => !t.completed).length);
    const hasActivities = isPomodoroRunning || pendingTodosCount > 0;

    return (
        <BasePage className="py-0 px-0 flex flex-col items-center" tools={<HomeTools />}>
            {/* 1. 搜索区域 - 页面顶部的视觉锚点 */}
            <div className="w-full max-w-4xl mt-24 mb-6 shrink-0 px-4">
                <SearchBar />
            </div>

            {/* 2. 实况区域 - 动态呼吸空间 */}
            <div className={cn(
                "w-full flex justify-center transition-all duration-500 ease-in-out px-4",
                hasActivities ? "mb-10" : "mb-0" // 保持边距逻辑
            )}>
                <LiveActivityArea>
                    <PomodoroLiveActivity />
                    <TodoLiveActivity />
                </LiveActivityArea>
            </div>

            {/* 3. 内容网格 - 主内容区 */}
            <div className="w-full flex-1 min-h-0 overflow-hidden">
                <TagGrid />
            </div>
        </BasePage>
    );
}

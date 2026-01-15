import { SearchBar } from "@/components/home/search/SearchBar";
import { BasePage } from "@/components/common";
import { TagGrid } from "@/components/items/tag";
import { LiveActivityArea } from "@/components/home/live/LiveActivityArea";
import { PomodoroLiveActivity } from "@/components/items/pomodoro/PomodoroDialog";
import { TodoLiveActivity } from "@/components/items/todo/TodoDialog";
import { HomeTools } from "@/components/home/tools/HomeTools";

export function HomePage() {
    return (
        <BasePage className="py-0 px-0 flex flex-col items-center" tools={<HomeTools />}>
            {/* 1. 搜索区域 - 页面顶部的视觉锚点 */}
            <div className="w-full max-w-4xl mt-24 mb-10 shrink-0 px-4">
                <SearchBar />
            </div>

            {/* 2. 实况区域 - 动态呼吸空间 (由组件内部控制间距) */}
            <div className="w-full flex justify-center px-4 shrink-0 transition-all duration-500">
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

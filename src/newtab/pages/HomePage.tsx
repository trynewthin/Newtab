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
            {/* 1. 实况区域 - 迁移至顶部 */}
            <div className="w-full flex justify-center px-4 shrink-0 transition-all duration-500 mt-20">
                <LiveActivityArea>
                    <PomodoroLiveActivity />
                    <TodoLiveActivity />
                </LiveActivityArea>
            </div>

            {/* 2. 搜索区域 - 页面核心锚点 */}
            <div className="w-full max-w-4xl mt-6 mb-2 shrink-0 px-4">
                <SearchBar />
            </div>

            {/* 3. 内容网格 - 主内容区 */}
            <div className="w-full flex-1 min-h-0 overflow-hidden">
                <TagGrid />
            </div>
        </BasePage>
    );
}

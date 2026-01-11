import { SearchBar } from "@/components/home/search/SearchBar";
import { TagGrid } from "@/components/home/tags/TagGrid";
import { LiveActivityArea } from "@/components/home/live/LiveActivityArea";
import { PomodoroLiveActivity } from "@/components/home/item/PomodoroDialog";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

import { BasePage } from "@/components/common/BasePage";
import { HomeTools } from "@/components/home/tools/HomeTools";

export function HomePage() {
    const isPomodoroRunning = useAppStore(s => s.pomodoroStatus.isRunning);
    const hasActivities = isPomodoroRunning; // 扩展点：未来如果增加其他活动，也加入此判断

    return (
        <BasePage className="py-0 px-0 flex flex-col items-center" tools={<HomeTools />}>
            {/* 1. 搜索区域 - 页面顶部的视觉锚点 */}
            <div className="w-full max-w-4xl mt-24 mb-6 shrink-0 px-4">
                <SearchBar />
            </div>

            {/* 2. 实况区域 - 动态呼吸空间 */}
            <div className={cn(
                "w-full flex justify-center transition-all duration-500 ease-in-out px-4",
                hasActivities ? "mb-10" : "mb-0"
            )}>
                <LiveActivityArea>
                    <PomodoroLiveActivity />
                </LiveActivityArea>
            </div>

            {/* 3. 内容网格 - 主内容区 */}
            <div className="w-full flex-1 min-h-0 overflow-hidden">
                <TagGrid />
            </div>
        </BasePage>
    );
}

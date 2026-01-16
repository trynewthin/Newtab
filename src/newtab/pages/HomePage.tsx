import { SearchBar } from "@/components/home/SearchBar";
import { BasePage } from "@/components/common";
import { AppGrid } from "@/apps/core";
import { HomeTools } from "@/components/home/HomeTools";

export function HomePage() {
    return (
        <BasePage className="py-0 px-0 flex flex-col items-center" tools={<HomeTools />}>
            {/* 1. 搜索区域 - 页面核心锚点 */}
            <div className="w-full max-w-4xl mt-32 mb-2 shrink-0 px-4">
                <SearchBar />
            </div>

            {/* 2. 内容网格 - 主内容区 */}
            <div className="w-full flex-1 min-h-0 overflow-hidden">
                <AppGrid />
            </div>
        </BasePage>
    );
}

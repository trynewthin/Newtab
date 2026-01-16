import { SearchBar } from "@/components/home/SearchBar";
import { BasePage } from "@/components/layout";
import { AppGrid } from "@/apps/core";
import { HomeTools } from "@/components/home/HomeTools";

export function HomePage() {
    return (
        <BasePage className="py-0 px-0 flex flex-col items-center" tools={<HomeTools />}>
            {/* 1. 鎼滅储鍖哄煙 - 椤甸潰鏍稿績閿氱偣 */}
            <div className="w-full max-w-4xl mt-32 mb-2 shrink-0 px-4">
                <SearchBar />
            </div>

            {/* 2. 鍐呭缃戞牸 - 涓诲唴瀹瑰尯 */}
            <div className="w-full flex-1 min-h-0 overflow-hidden">
                <AppGrid />
            </div>
        </BasePage>
    );
}

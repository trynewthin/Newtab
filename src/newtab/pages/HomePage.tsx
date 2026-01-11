import { SearchBar } from "@/components/home/search/SearchBar";
import { TagGrid } from "@/components/home/tags/TagGrid";

import { BasePage } from "@/components/common/BasePage";
import { HomeTools } from "@/components/home/tools/HomeTools";

export function HomePage() {
    return (
        <BasePage className="py-8 px-0 flex flex-col items-center" tools={<HomeTools />}>
            <div className="w-full max-w-4xl mt-7">
                <SearchBar />
            </div>
            <div className="w-full flex-1 overflow-hidden">
                <TagGrid />
            </div>
        </BasePage>
    );
}

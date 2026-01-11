import { SearchBar } from "@/components/home/SearchBar";
import { TagGrid } from "@/components/home/TagGrid";

export function HomePage() {
    return (
        <div className="w-full h-full py-8 px-0 pointer-events-auto flex flex-col items-center">
            <div className="w-full max-w-4xl mt-7">
                <SearchBar />
            </div>
            <div className="w-full flex-1 overflow-hidden">
                <TagGrid />
            </div>
        </div>
    );
}

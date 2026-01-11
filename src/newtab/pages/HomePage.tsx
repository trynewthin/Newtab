import { SearchBar } from "@/components/home/SearchBar";
import { TagGrid } from "@/components/home/TagGrid";

export function HomePage() {
    return (
        <div className="w-full h-full p-8 pointer-events-auto flex flex-col items-center">
            <div className="w-full max-w-4xl mt-2">
                <SearchBar />
            </div>
            <div className="w-full flex-1">
                <TagGrid />
            </div>
        </div>
    );
}

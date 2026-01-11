import { Plus } from "lucide-react";

interface AddTagItemProps {
    onClick: () => void;
}

export function AddTagItem({ onClick }: AddTagItemProps) {
    return (
        <div className="group relative flex flex-col items-center gap-1.5">
            <button
                onClick={onClick}
                className="flex items-center justify-center w-14 h-14 bg-white/50 border-2 border-dashed border-white/50 rounded-2xl group-hover:border-white group-hover:bg-white/80 transition-all shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
                <Plus className="text-muted-foreground group-hover:text-primary" />
            </button>
            <span className="text-xs text-center font-medium text-muted-foreground group-hover:text-foreground max-w-[80px]">
                Add
            </span>
        </div>
    );
}

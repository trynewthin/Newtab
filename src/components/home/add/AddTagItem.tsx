import { Plus } from "lucide-react";

interface AddTagItemProps {
    onClick: () => void;
}

export function AddTagItem({ onClick }: AddTagItemProps) {
    return (
        <div className="group relative flex flex-col items-center gap-1.5">
            <button
                onClick={onClick}
                className="flex items-center justify-center w-14 h-14 bg-white/80 hover:bg-white border-2 border-dashed border-muted-foreground/20 rounded-2xl transition-all shadow-sm outline-none hover:shadow-md hover:border-primary/50 group-hover:scale-105"
            >
                <Plus className="text-muted-foreground group-hover:text-primary transition-colors" />
            </button>
            <span className="text-xs text-center font-medium text-muted-foreground group-hover:text-foreground max-w-[80px]">
                Add
            </span>
        </div>
    );
}

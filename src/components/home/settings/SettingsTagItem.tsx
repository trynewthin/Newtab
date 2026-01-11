import { Settings } from "lucide-react";

interface SettingsTagItemProps {
    onClick: () => void;
}

export function SettingsTagItem({ onClick }: SettingsTagItemProps) {
    return (
        <div className="group relative flex flex-col items-center gap-1.5">
            <button
                onClick={onClick}
                className="flex items-center justify-center w-14 h-14 rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden bg-white group-hover:scale-105 cursor-pointer"
            >
                <Settings size={24} className="text-muted-foreground group-hover:text-primary transition-colors" />
            </button>

            <span className="text-xs text-center font-medium truncate w-full max-w-[80px] drop-shadow-sm text-foreground/80 group-hover:text-foreground">
                Settings
            </span>
        </div>
    );
}

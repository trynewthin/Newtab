import { Settings } from "lucide-react";
import { Link } from "react-router-dom";

export function SettingsTagItem() {
    return (
        <div className="group relative flex flex-col items-center gap-1.5">
            <Link
                to="/settings"
                className="flex items-center justify-center w-14 h-14 rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden bg-muted/50 hover:bg-muted"
            >
                <Settings size={24} className="text-muted-foreground group-hover:text-foreground transition-colors" />
            </Link>

            <span className="text-xs text-center font-medium truncate w-full max-w-[80px] drop-shadow-sm text-foreground/80 group-hover:text-foreground">
                Settings
            </span>
        </div>
    );
}

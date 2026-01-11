import { useAppStore } from "@/lib/store";
import { Sun, Moon, Edit2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function HomeTools() {
    const { theme, setTheme, isEditing, setEditing } = useAppStore();

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    const toggleEditing = () => {
        setEditing(!isEditing);
    };

    const isDark = theme === 'dark';

    return (
        <>
            <button
                onClick={toggleEditing}
                className={cn(
                    "p-2 rounded-lg transition-all shadow-sm border backdrop-blur-sm",
                    isEditing
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-secondary/80 hover:bg-secondary text-secondary-foreground"
                )}
                title={isEditing ? 'Exit Edit Mode' : 'Enter Edit Mode'}
            >
                <Edit2 size={18} />
            </button>
            <button
                onClick={toggleTheme}
                className="p-2 bg-secondary/80 hover:bg-secondary text-secondary-foreground rounded-lg transition-all shadow-sm border backdrop-blur-sm"
                title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
        </>
    );
}

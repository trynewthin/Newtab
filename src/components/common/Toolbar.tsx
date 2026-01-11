import { useAppStore } from "@/lib/store";
import { Sun, Moon } from "lucide-react";

export function Toolbar() {
    const { theme, setTheme } = useAppStore();

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    const isDark = theme === 'dark';

    return (
        <button
            onClick={toggleTheme}
            className="p-2 bg-secondary/80 hover:bg-secondary text-secondary-foreground rounded-lg transition-all shadow-sm border backdrop-blur-sm"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
    );
}

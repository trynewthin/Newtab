import { Moon, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useThemePreferenceStore } from "@/config";
import { cn } from "@/shared/utils";

export function ThemeQuickToggleButton() {
    const { t } = useTranslation();
    const theme = useThemePreferenceStore((state) => state.theme);
    const setTheme = useThemePreferenceStore((state) => state.setTheme);
    const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

    return (
        <button
            type="button"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            aria-label={t("theme_mode")}
            title={t("theme_mode")}
            className={cn(
                "inline-flex h-9 w-9 items-center justify-center rounded-xl",
                "border border-border/80 bg-background/76 text-foreground/82",
                "shadow-[0_10px_30px_rgba(0,0,0,0.14)] transition-all duration-200",
                "hover:bg-background/92 hover:text-foreground hover:scale-[1.02]",
                "active:scale-[0.98]",
            )}
        >
            {isDark ? <Sun size={16} strokeWidth={2.4} /> : <Moon size={16} strokeWidth={2.4} />}
        </button>
    );
}

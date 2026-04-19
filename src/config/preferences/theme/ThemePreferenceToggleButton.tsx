import { Moon, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";
import { resolveThemeMode } from "./shared";
import { useThemePreferenceStore } from "./store";

export function ThemePreferenceToggleButton() {
    const { t } = useTranslation();
    const theme = useThemePreferenceStore((state) => state.theme);
    const setTheme = useThemePreferenceStore((state) => state.setTheme);
    const isDark = resolveThemeMode(theme) === "dark";

    return (
        <button
            type="button"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            aria-label={t("theme_mode")}
            title={t("theme_mode")}
            className={[
                "inline-flex h-9 w-9 items-center justify-center rounded-xl",
                "border border-border/80 bg-background/76 text-foreground/82",
                "shadow-[0_10px_30px_rgba(0,0,0,0.14)] transition-all duration-200",
                "hover:bg-background/92 hover:text-foreground hover:scale-[1.02]",
                "dark:border-white/10 dark:bg-white/[0.06] dark:text-white/82",
                "dark:shadow-[0_4px_14px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.05)]",
                "dark:hover:border-white/14 dark:hover:bg-white/[0.09] dark:hover:text-white/96",
                "dark:active:bg-white/[0.11]",
                "active:scale-[0.98]",
            ].join(" ")}
        >
            {isDark ? <Sun size={16} strokeWidth={2.4} /> : <Moon size={16} strokeWidth={2.4} />}
        </button>
    );
}

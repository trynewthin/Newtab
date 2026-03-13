import { useEffect, useState, type ComponentType } from "react";
import { useTranslation } from "react-i18next";
import { BackgroundSelector } from "@/apps/settings/components/BackgroundSelector";
import { SurfaceMaterialSettings } from "@/apps/settings/components/SurfaceMaterialSettings";
import { ArrowLeft, ChevronRight, Image, Settings as SettingsIcon, Sparkles } from "lucide-react";
import { cn } from "@/core/utils";
import { SettingsItem, SettingsSection } from "@/apps/settings/components/SettingComponents";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSettingsStore } from "@/apps/settings/store";

type ThemeSettingsSubPage = "home" | "background" | "material";

export function AppearanceSettings() {
    const { t } = useTranslation();
    const [subPage, setSubPage] = useState<ThemeSettingsSubPage>("home");
    const { theme, setTheme } = useSettingsStore();

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove("light", "dark");
        if (theme === "system") {
            const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
            root.classList.add(systemTheme);
        } else {
            root.classList.add(theme);
        }
    }, [theme]);

    const themeOptions = {
        light: t("light"),
        dark: t("dark"),
        system: t("system"),
    };

    const isHome = subPage === "home";

    const NavEntry = ({
        icon: Icon,
        title,
        onClick,
    }: {
        icon: ComponentType<{ size?: number; className?: string }>;
        title: string;
        onClick: () => void;
    }) => (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "group flex w-full items-center justify-between rounded-2xl px-4 py-3.5 text-left",
                "shadow-[0_4px_12px_rgba(0,0,0,0.12),0_2px_6px_rgba(0,0,0,0.08)]",
                "dark:shadow-[0_4px_12px_rgba(255,255,255,0.08),0_2px_6px_rgba(255,255,255,0.05)]",
                "transition-all hover:scale-[1.01]",
            )}
        >
            <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-foreground/6 text-foreground/80">
                    <Icon size={18} />
                </div>
                <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-foreground">{title}</div>
                </div>
            </div>
            <ChevronRight size={16} className="shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </button>
    );

    return (
                <div className="mx-auto max-w-3xl space-y-6">
                    {!isHome && (
                        <button
                            type="button"
                            onClick={() => setSubPage("home")}
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground transition-all hover:bg-foreground/8 hover:text-foreground"
                        >
                            <ArrowLeft size={14} />
                            <span>{t("back_to_theme_settings")}</span>
                        </button>
                    )}
                    {isHome ? (
                        <>
                            <SettingsSection
                                icon={SettingsIcon}
                                iconColor="text-blue-500"
                                title={t("theme_mode")}
                                description={t("theme_mode_desc")}
                            >
                                <SettingsItem label={t("theme_mode")}>
                                    <Select value={theme} onValueChange={(value) => setTheme(value as "light" | "dark" | "system")}>
                                        <SelectTrigger className="h-9 w-[180px] rounded-xl border-foreground/10 bg-foreground/4">
                                            <SelectValue>
                                                {themeOptions[theme as keyof typeof themeOptions]}
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="light">{t("light")}</SelectItem>
                                            <SelectItem value="dark">{t("dark")}</SelectItem>
                                            <SelectItem value="system">{t("system")}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </SettingsItem>
                            </SettingsSection>

                            <div className="space-y-2">
                                <NavEntry
                                    icon={Image}
                                    title={t("background")}
                                    onClick={() => setSubPage("background")}
                                />
                                <NavEntry
                                    icon={Sparkles}
                                    title={t("surface_materials")}
                                    onClick={() => setSubPage("material")}
                                />
                            </div>
                        </>
                    ) : null}

                    {subPage === "background" ? <BackgroundSelector /> : null}
                    {subPage === "material" ? <SurfaceMaterialSettings /> : null}
                </div>
    );
}


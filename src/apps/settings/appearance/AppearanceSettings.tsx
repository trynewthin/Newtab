import { useEffect, useState, type ComponentType } from "react";
import { useTranslation } from "react-i18next";
import { SidebarHeader } from "@/platform/shared/components";
import { BackgroundSelector } from "@/apps/settings/base/BackgroundSelector";
import { SurfaceMaterialSettings } from "@/apps/settings/base/SurfaceMaterialSettings";
import { ArrowLeft, ChevronRight, Image, Settings as SettingsIcon, Sparkles } from "lucide-react";
import { cn } from "@/platform/core/utils";
import { SettingsItem, SettingsSection } from "@/apps/settings/base/SettingComponents";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSettingsStore } from "@/apps/settings/store";

interface AppearanceSettingsProps {
    onOpenMobileMenu?: () => void;
    onClose?: () => void;
}

type ThemeSettingsSubPage = "home" | "background" | "material";

export function AppearanceSettings({ onOpenMobileMenu, onClose }: AppearanceSettingsProps) {
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
    const headerTitle = isHome
        ? t("theme_settings")
        : subPage === "background"
            ? t("background")
            : t("surface_materials");
    const headerDescription = isHome
        ? t("appearance_desc")
        : subPage === "background"
            ? t("theme_settings_background_page_desc")
            : t("theme_settings_material_page_desc");

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
                "group flex w-full items-center justify-between rounded-2xl border border-border/70 bg-background/86 px-4 py-3.5 text-left",
                "transition-all hover:border-foreground/20 hover:bg-foreground/6"
            )}
        >
            <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background text-foreground/80">
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
        <div className="h-full flex flex-col">
            <SidebarHeader
                title={headerTitle}
                description={headerDescription}
                onMenuClick={onOpenMobileMenu}
                onClose={onClose}
            >
                {!isHome ? (
                    <button
                        type="button"
                        onClick={() => setSubPage("home")}
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground transition-all hover:bg-foreground/8 hover:text-foreground"
                    >
                        <ArrowLeft size={14} />
                        <span className="hidden sm:inline">{t("back_to_theme_settings")}</span>
                    </button>
                ) : null}
            </SidebarHeader>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="mx-auto max-w-3xl space-y-6 p-5">
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
                                        <SelectTrigger className="h-9 w-[180px] rounded-xl border-border/70 bg-background/85">
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
            </div>
        </div>
    );
}


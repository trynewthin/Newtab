import { type ComponentType } from "react";
import { useTranslation } from "react-i18next";
import { useThemePreferenceStore } from "@/config";
import { BackgroundSelector } from "@/apps/settings/components/BackgroundSelector";
import { SurfaceMaterialSettings } from "@/apps/settings/components/SurfaceMaterialSettings";
import { ChevronRight, Image, Sparkles } from "lucide-react";
import { cn } from "@/shared/utils";
import { SETTINGS_FIELD_CLASS, SettingsItem, SettingsSection } from "@/apps/settings/components/SettingComponents";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type ThemeSettingsSubPage = "home" | "background" | "material";

function AppearanceNavEntry({
    icon: Icon,
    title,
    onClick,
}: {
    icon: ComponentType<{ size?: number; className?: string }>;
    title: string;
    onClick: () => void;
}) {
    return (
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
}

interface AppearanceSettingsProps {
    subPage: ThemeSettingsSubPage;
    onSubPageChange: (page: ThemeSettingsSubPage) => void;
}

export function AppearanceSettings({ subPage, onSubPageChange }: AppearanceSettingsProps) {
    const { t } = useTranslation();
    const theme = useThemePreferenceStore((state) => state.theme);
    const setTheme = useThemePreferenceStore((state) => state.setTheme);

    const themeOptions = {
        light: t("light"),
        dark: t("dark"),
        system: t("system"),
    };

    const isHome = subPage === "home";

    return (
        <div className="mx-auto max-w-3xl space-y-6">
            {isHome ? (
                <>
                    <SettingsSection title={t("theme_mode")}>
                        <SettingsItem label={t("theme_mode")}>
                            <Select value={theme} onValueChange={(value) => setTheme(value as "light" | "dark" | "system")}>
                                <SelectTrigger className={`${SETTINGS_FIELD_CLASS} w-[180px]`}>
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
                        <AppearanceNavEntry
                            icon={Image}
                            title={t("background")}
                            onClick={() => onSubPageChange("background")}
                        />
                        <AppearanceNavEntry
                            icon={Sparkles}
                            title={t("surface_materials")}
                            onClick={() => onSubPageChange("material")}
                        />
                    </div>
                </>
            ) : null}

            {subPage === "background" ? <BackgroundSelector /> : null}
            {subPage === "material" ? <SurfaceMaterialSettings /> : null}
        </div>
    );
}

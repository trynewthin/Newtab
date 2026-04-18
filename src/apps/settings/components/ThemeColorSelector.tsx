import { useAppearancePreferenceStore } from "@/config";
import { PRIMARY_COLORS } from "@/apps/settings/appearance/themeConfig";
import { Check, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/shared/utils";
import { SettingsSection } from "./SettingComponents";

export function ThemeColorSelector() {
    const { t } = useTranslation();
    const { primaryColor, setPrimaryColor } = useAppearancePreferenceStore();
    const getColorLabel = (name: string) => t(`color_${name.toLowerCase()}`);

    return (
        <SettingsSection title={t("primary_color_system")}>
            <div className="flex flex-wrap justify-start gap-3">
                {PRIMARY_COLORS.map((color) => (
                    <button
                        key={color.name}
                        onClick={() => setPrimaryColor(color.value)}
                        className={cn(
                            "relative z-0 flex h-10 w-10 items-center justify-center rounded-xl shadow-sm transition-all duration-300 group",
                            primaryColor === color.value
                                ? "z-10 scale-110 ring-1 ring-primary/40 shadow-lg shadow-primary/20"
                                : "bg-background ring-1 ring-border/10 hover:scale-110 hover:shadow-md"
                        )}
                        style={{ backgroundColor: color.value }}
                        title={getColorLabel(color.name)}
                    >
                        {primaryColor === color.value && (
                            <Check
                                className="animate-in zoom-in text-white drop-shadow-md duration-300"
                                size={20}
                                strokeWidth={3.5}
                            />
                        )}

                        <span className="pointer-events-none absolute -bottom-7 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded bg-foreground px-2 py-0.5 text-[9px] font-bold text-background opacity-0 transition-opacity group-hover:opacity-100">
                            {getColorLabel(color.name)}
                        </span>
                    </button>
                ))}

                <label
                    className={cn(
                        "relative flex h-10 w-10 cursor-pointer items-center justify-center overflow-hidden rounded-xl shadow-sm transition-all duration-300 group",
                        !PRIMARY_COLORS.some((color) => color.value === primaryColor)
                            ? "z-10 scale-110 ring-1 ring-primary/40 shadow-lg shadow-primary/20"
                            : "bg-secondary/30 border-2 border-dashed border-border/30 hover:scale-110 hover:border-primary/50"
                    )}
                >
                    <input
                        type="color"
                        className="absolute inset-0 z-20 h-full w-full cursor-pointer opacity-0"
                        value={primaryColor}
                        onChange={(event) => setPrimaryColor(event.target.value)}
                    />
                    {!PRIMARY_COLORS.some((color) => color.value === primaryColor) ? (
                        <div
                            className="flex h-full w-full items-center justify-center"
                            style={{ backgroundColor: primaryColor }}
                        >
                            <Check
                                className="animate-in zoom-in text-white drop-shadow-md duration-300"
                                size={20}
                                strokeWidth={3.5}
                            />
                        </div>
                    ) : (
                        <Plus
                            size={20}
                            className="text-muted-foreground transition-colors group-hover:scale-110 group-hover:text-primary"
                        />
                    )}
                </label>
            </div>
        </SettingsSection>
    );
}

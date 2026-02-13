import { useSettingsStore } from "@/apps/settings/store";
import { cn } from "@/core/utils";
import { Check, Plus, Palette } from "lucide-react";
import { PRIMARY_COLORS } from "@/apps/settings/appearance/themeConfig";
import { useTranslation } from "react-i18next";
import { SettingsSection } from "./SettingComponents";

export function ThemeColorSelector() {
    const { t } = useTranslation();
    const { primaryColor, setPrimaryColor } = useSettingsStore();
    const getColorLabel = (name: string) => t(`color_${name.toLowerCase()}`);

    return (
        <SettingsSection
            icon={Palette}
            iconColor="text-indigo-500"
            title={t('primary_color_system')}
            description={t('select_accent_color')}
        >
            <div className="flex flex-wrap justify-start gap-3">
                {PRIMARY_COLORS.map((color) => (
                    <button
                        key={color.name}
                        onClick={() => setPrimaryColor(color.value)}
                        className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 relative group shadow-sm",
                            primaryColor === color.value
                                ? "scale-110 ring-1 ring-primary/40 shadow-lg shadow-primary/20 z-10"
                                : "hover:scale-110 bg-background ring-1 ring-border/10 hover:shadow-md"
                        )}
                        style={{ backgroundColor: color.value }}
                        title={getColorLabel(color.name)}
                    >
                        {primaryColor === color.value && (
                            <Check className="text-white drop-shadow-md animate-in zoom-in duration-300" size={20} strokeWidth={3.5} />
                        )}

                        {/* Tooltip hint on hover */}
                        <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-foreground text-background text-[9px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 whitespace-nowrap">
                            {getColorLabel(color.name)}
                        </span>
                    </button>
                ))}

                {/* Custom Color Input */}
                <label className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 cursor-pointer relative overflow-hidden shadow-sm group",
                    !PRIMARY_COLORS.some(c => c.value === primaryColor)
                        ? "scale-110 ring-1 ring-primary/40 shadow-lg shadow-primary/20 z-10"
                        : "hover:scale-110 bg-secondary/30 border-2 border-dashed border-border/30 hover:border-primary/50"
                )}>
                    <input
                        type="color"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                    />
                    {!PRIMARY_COLORS.some(c => c.value === primaryColor) ? (
                        <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: primaryColor }}>
                            <Check className="text-white drop-shadow-md animate-in zoom-in duration-300" size={20} strokeWidth={3.5} />
                        </div>
                    ) : (
                        <Plus size={20} className="text-muted-foreground group-hover:text-primary transition-colors group-hover:scale-110" />
                    )}
                </label>
            </div>
        </SettingsSection>
    );
}


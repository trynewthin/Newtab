import { useSettingsStore } from "@/store/modules/settings";
import { cn } from "@/lib/utils";
import { Check, Plus } from "lucide-react";
import { PRIMARY_COLORS } from "../themeConfig";
import { useTranslation } from "react-i18next";
import { SettingsSection } from "./SettingsSection";

export function ThemeColorSelector() {
    const { t } = useTranslation();
    const { primaryColor, setPrimaryColor } = useSettingsStore();

    return (
        <SettingsSection
            title={t('primary_color_system')}
            description={t('select_accent_color') || "Choose a primary accent color for buttons, highlights, and active elements."}
        >
            <div className="flex flex-wrap justify-center gap-4 py-2">
                {PRIMARY_COLORS.map((color) => (
                    <button
                        key={color.name}
                        onClick={() => setPrimaryColor(color.value)}
                        className={cn(
                            "w-12 h-12 rounded-3xl flex items-center justify-center transition-all duration-300 relative group shadow-sm",
                            primaryColor === color.value
                                ? "scale-110 ring-4 ring-primary/20 shadow-xl shadow-primary/20 z-10"
                                : "hover:scale-110 bg-background ring-1 ring-border/10 hover:shadow-md"
                        )}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                    >
                        {primaryColor === color.value && (
                            <Check className="text-white drop-shadow-md animate-in zoom-in duration-300" size={24} strokeWidth={3.5} />
                        )}

                        {/* Tooltip hint on hover */}
                        <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-foreground text-background text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 whitespace-nowrap">
                            {color.name}
                        </span>
                    </button>
                ))}

                {/* Custom Color Input */}
                <label className={cn(
                    "w-12 h-12 rounded-3xl flex items-center justify-center transition-all duration-300 cursor-pointer relative overflow-hidden shadow-sm group",
                    !PRIMARY_COLORS.some(c => c.value === primaryColor)
                        ? "scale-110 ring-4 ring-primary/20 shadow-xl shadow-primary/20 z-10"
                        : "hover:scale-110 bg-secondary/30 border-2 border-dashed border-border/50 hover:border-primary/50"
                )}>
                    <input
                        type="color"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                    />
                    {!PRIMARY_COLORS.some(c => c.value === primaryColor) ? (
                        <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: primaryColor }}>
                            <Check className="text-white drop-shadow-md animate-in zoom-in duration-300" size={24} strokeWidth={3.5} />
                        </div>
                    ) : (
                        <Plus size={24} className="text-muted-foreground group-hover:text-primary transition-colors group-hover:scale-110" />
                    )}
                </label>
            </div>
        </SettingsSection>
    );
}

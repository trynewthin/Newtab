import { useTranslation } from "react-i18next";
import { AppWindow, Puzzle } from "lucide-react";
import { cn } from "@/shared/utils";

export type MarketTab = "icons" | "widgets";

interface MarketTabBarProps {
    activeTab: MarketTab;
    onTabChange: (tab: MarketTab) => void;
}

const TABS: { id: MarketTab; icon: typeof AppWindow; labelKey: string }[] = [
    { id: "icons", icon: AppWindow, labelKey: "component_market_app_icons" },
    { id: "widgets", icon: Puzzle, labelKey: "component_market_components" },
];

/**
 * Tab content for the GlassModal header slot.
 * Renders tab switcher + close button — the glass frame is provided by GlassModal.
 */
export function MarketTabBar({ activeTab, onTabChange }: MarketTabBarProps) {
    const { t } = useTranslation();

    return (
        <>
            {/* Tab switcher */}
            <div className="flex items-center gap-0.5">
                {TABS.map((tab) => {
                    const isActive = activeTab === tab.id;
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => onTabChange(tab.id)}
                            className={cn(
                                "h-7 w-7 sm:w-auto sm:px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider",
                                "rounded-full sm:rounded-lg transition-all duration-200 flex items-center justify-center sm:justify-start gap-1.5",
                                isActive
                                    ? "bg-foreground text-background shadow-sm"
                                    : "text-muted-foreground hover:text-foreground hover:bg-secondary",
                            )}
                        >
                            <Icon size={13} strokeWidth={isActive ? 2.5 : 2} />
                            <span className="hidden sm:inline">{t(tab.labelKey)}</span>
                        </button>
                    );
                })}
            </div>
        </>
    );
}

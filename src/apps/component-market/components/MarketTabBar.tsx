import { useTranslation } from "react-i18next";
import { AppWindow, Puzzle, X } from "lucide-react";
import { cn } from "@/core/utils";
import { Dialog } from "@base-ui/react/dialog";
import AppSurface from "@/components/surface/AppSurface";

export type MarketTab = "icons" | "widgets";

interface MarketTabBarProps {
    activeTab: MarketTab;
    onTabChange: (tab: MarketTab) => void;
}

const TABS: { id: MarketTab; icon: typeof AppWindow; labelKey: string }[] = [
    { id: "icons", icon: AppWindow, labelKey: "component_market_app_icons" },
    { id: "widgets", icon: Puzzle, labelKey: "component_market_components" },
];

export function MarketTabBar({ activeTab, onTabChange }: MarketTabBarProps) {
    const { t } = useTranslation();

    return (
        <div className="absolute inset-x-0 top-0 z-30 pointer-events-none">
            <div className="mx-3 mt-3 relative overflow-hidden rounded-xl pointer-events-auto shadow-[0_4px_16px_rgba(0,0,0,0.15),0_2px_6px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_16px_rgba(255,255,255,0.08),0_2px_6px_rgba(255,255,255,0.05)]">
                <div className="absolute inset-0 z-0">
                    <AppSurface variant="toolbar" width="100%" height="100%" />
                </div>
                <div className="relative z-10 flex items-center justify-between gap-3 p-1.5">
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
                                        "px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all duration-200 flex items-center gap-1.5",
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

                    {/* Close button */}
                    <Dialog.Close
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                    >
                        <X size={14} strokeWidth={2.5} />
                    </Dialog.Close>
                </div>
            </div>
        </div>
    );
}

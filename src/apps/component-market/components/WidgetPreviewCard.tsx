import { useTranslation } from "react-i18next";
import { cn } from "@/shared/utils";
import type { ComponentMarketItem } from "./WidgetGallery";

interface WidgetPreviewCardProps {
    item: ComponentMarketItem;
    isActive: boolean;
    onSelect: () => void;
}

export function WidgetPreviewCard({
    item,
    isActive,
    onSelect,
}: WidgetPreviewCardProps) {
    const { t } = useTranslation();
    const supportedPresets = item.supportedPresets.map((preset) =>
        preset.toUpperCase()
    );

    return (
        <button
            type="button"
            onClick={onSelect}
            className={cn(
                "group/widget flex h-full w-full flex-col justify-between gap-2 rounded-[1.5rem] border px-4 py-3 text-left transition-all",
                isActive
                    ? "border-foreground/18 bg-foreground/7 shadow-[0_16px_40px_rgba(0,0,0,0.10)]"
                    : "border-border/70 bg-background/82 hover:border-foreground/16 hover:bg-foreground/4"
            )}
        >
            <div className="text-sm font-semibold leading-5 text-foreground">
                {t(item.title)}
            </div>
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground/72">
                {supportedPresets.join("  ")}
            </div>
        </button>
    );
}

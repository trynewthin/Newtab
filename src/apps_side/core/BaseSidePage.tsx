import React, { useState } from "react";
import { LayoutGrid } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import aiIcon from "@/assets/ai-icon.png";
import type { SystemType } from "@/apps/core/system/systemRegistry";
import { useUIStore } from "@/store/modules/ui";
import { cn } from "@/lib/utils";

type FloatingAppItem = {
    type: SystemType;
    title: string;
    icon: string;
};

const DEFAULT_APPS: FloatingAppItem[] = [
    { type: "ai", title: "AI Assistant", icon: aiIcon }
];

interface SideFloatingHeaderProps {
    header?: React.ReactNode;
    apps: FloatingAppItem[];
    appName?: string;
}

export function SideFloatingHeader({ header, apps, appName }: SideFloatingHeaderProps) {
    const { setActiveSystemDialog } = useUIStore();
    const [open, setOpen] = useState(false);

    return (
        <div className="absolute inset-x-0 top-0 z-20 pointer-events-none">
            <div className="relative flex items-center gap-3 px-3 pt-3 pointer-events-auto">
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger
                        className="h-10 px-3 rounded-full glass-button flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
                        title={appName || "Apps"}
                    >
                        <LayoutGrid size={16} className="text-foreground/80" />
                        {appName && (
                            <span className="text-xs font-semibold tracking-wide text-foreground/90">
                                {appName}
                            </span>
                        )}
                    </PopoverTrigger>
                    <PopoverContent
                        align="start"
                        side="bottom"
                        className="w-[200px] p-2 bg-white/85 dark:bg-black/80 backdrop-blur-xl border border-black/10 dark:border-white/10 shadow-2xl rounded-2xl ring-1 ring-black/5 dark:ring-white/10"
                    >
                        <div className="flex flex-col gap-1">
                            {apps.map(item => (
                                <button
                                    key={item.type}
                                    type="button"
                                    onClick={() => {
                                        setActiveSystemDialog(item.type);
                                        setOpen(false);
                                    }}
                                    className={cn(
                                        "w-full text-left px-3 py-2 rounded-xl text-xs font-semibold",
                                        "hover:bg-secondary/70 transition-all text-foreground/90"
                                    )}
                                >
                                    {item.title}
                                </button>
                            ))}
                        </div>
                    </PopoverContent>
                </Popover>

                {header && (
                    <div className="flex-1 min-w-0 h-10 flex items-center">
                        {header}
                    </div>
                )}
            </div>
        </div>
    );
}

interface BaseSidePageProps {
    background?: React.ReactNode;
    content?: React.ReactNode;
    floating?: React.ReactNode;
    floatingHeader?: React.ReactNode;
    floatingApps?: FloatingAppItem[];
    appName?: string;
    floatingPreset?: "none" | "header";
    className?: string;
    backgroundClassName?: string;
    contentClassName?: string;
    floatingClassName?: string;
}

export function BaseSidePage({
    background,
    content,
    floating,
    floatingHeader,
    floatingApps,
    appName,
    floatingPreset = "none",
    className,
    backgroundClassName,
    contentClassName,
    floatingClassName
}: BaseSidePageProps) {
    const renderFloatingPreset = () => {
        if (floatingPreset === "header") {
            return (
                <SideFloatingHeader
                    header={floatingHeader}
                    apps={floatingApps || DEFAULT_APPS}
                    appName={appName}
                />
            );
        }
        return null;
    };

    return (
        <div className={cn("w-full h-screen relative font-sans select-none overflow-hidden text-[13px]", className)}>
            <div className={cn("absolute inset-0 z-0", backgroundClassName)}>
                {background}
            </div>
            <div className={cn("relative z-10 flex flex-col h-full", contentClassName)}>
                {content}
            </div>
            <div className={cn("absolute inset-0 z-20 pointer-events-none", floatingClassName)}>
                <div className="pointer-events-auto">
                    {renderFloatingPreset()}
                </div>
                <div className="pointer-events-auto">
                    {floating}
                </div>
            </div>
        </div>
    );
}

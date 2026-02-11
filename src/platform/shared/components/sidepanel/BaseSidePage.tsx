import React, { useState } from "react";
import { LayoutGrid } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/platform/shared/ui/popover";
import { cn } from "@/platform/core/utils";
import { AppLayerShell } from "@/platform/shared/components/surface/AppLayerShell";
import {
    DEFAULT_SIDE_APPS,
    type SystemAppId,
    getAppManifestItem,
    supportsSurface,
} from "@/apps/launcher/system/appManifest";
import { useAppLauncher } from "@/apps/launcher/system/useAppLauncher";
import { useOptionalAppSurfaceBridge } from "@/apps/launcher/system/appSurfaceBridge";
import { renderSystemIcon } from "@/apps/launcher/system/systemIcons";

type FloatingAppItem = {
    type: SystemAppId;
    title: string;
    icon: string;
};

const DEFAULT_APPS: FloatingAppItem[] = DEFAULT_SIDE_APPS.map((id) => {
    const manifest = getAppManifestItem(id);
    return {
        type: id,
        title: manifest?.title ?? id,
        icon: manifest?.icon ?? "Grid3x3",
    };
});

interface SideFloatingHeaderProps {
    header?: React.ReactNode;
    apps: FloatingAppItem[];
    appName?: string;
}

export function SideFloatingHeader({ header, apps, appName }: SideFloatingHeaderProps) {
    const { launchApp, launchToSurface } = useAppLauncher();
    const bridge = useOptionalAppSurfaceBridge();
    const [open, setOpen] = useState(false);
    const selectedApp = bridge?.surface === "sidebar" ? bridge.appId : null;

    const handleAppClick = (type: SystemAppId) => {
        if (bridge?.surface === "sidebar" && supportsSurface(type, "sidebar")) {
            launchToSurface(type, "sidebar");
        } else {
            launchApp(type);
        }
        setOpen(false);
    };

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
                                    onClick={() => handleAppClick(item.type)}
                                    className={cn(
                                        "w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all",
                                        "hover:bg-black/5 dark:hover:bg-white/10 text-foreground/90",
                                        item.type === selectedApp && "bg-black/5 dark:bg-white/10 text-primary"
                                    )}
                                >
                                    {renderSystemIcon(item.icon, cn("w-3.5 h-3.5 opacity-60", item.type === selectedApp && "opacity-100"))}
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
    const renderFloatingPreset = (): React.ReactNode => {
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
        <AppLayerShell
            className={cn("w-full h-screen font-sans select-none text-[13px]", className)}
            background={background}
            content={<div className="flex flex-col h-full">{content}</div>}
            floating={(
                <>
                    <div className="pointer-events-auto">
                        {renderFloatingPreset()}
                    </div>
                    <div className="pointer-events-auto">
                        {floating}
                    </div>
                </>
            )}
            backgroundClassName={backgroundClassName}
            contentClassName={contentClassName}
            floatingClassName={floatingClassName}
        />
    );
}


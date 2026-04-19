import { cn } from "@/shared/utils";
import { LAUNCHER_ICON_VISUAL_CLASS_V1 } from "./iconVisualStyles";
import type { ResolvedLauncherIconV1 } from "./types";
import { LauncherIconVisualV1 } from "./LauncherIconVisualV1";

export interface LauncherIconTileV1Props {
    displayTitle: string;
    icon: ResolvedLauncherIconV1;
    hideLabel?: boolean;
    className?: string;
    visualClassName?: string;
    labelClassName?: string;
}

export function LauncherIconTileV1({
    displayTitle,
    icon,
    hideLabel = false,
    className,
    visualClassName,
    labelClassName,
}: LauncherIconTileV1Props) {
    return (
        <div className={cn("flex w-14 flex-col items-center", hideLabel ? "gap-0" : "gap-1.5", className)}>
            <LauncherIconVisualV1
                icon={icon}
                className={cn(LAUNCHER_ICON_VISUAL_CLASS_V1, visualClassName)}
            />
            {!hideLabel ? (
                <span className={cn("w-full max-w-[80px] truncate text-center text-xs font-medium text-white drop-shadow-md select-none", labelClassName)}>
                    {displayTitle}
                </span>
            ) : null}
        </div>
    );
}

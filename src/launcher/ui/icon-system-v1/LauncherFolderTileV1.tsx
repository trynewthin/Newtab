import { AppSurface } from "@/platform/ui";
import { cn } from "@/shared/utils";
import type { FolderIconLayoutV1, ResolvedLauncherIconV1 } from "./types";
import { IconFrameV1 } from "./IconFrameV1";
import { FolderIconContentV1 } from "./FolderIconContentV1";

export interface LauncherFolderTileV1Props {
    displayTitle: string;
    icons: ResolvedLauncherIconV1[];
    layout: FolderIconLayoutV1;
    hideLabel?: boolean;
    className?: string;
    visualClassName?: string;
    labelClassName?: string;
}

function getVisualClassName(layout: FolderIconLayoutV1) {
    return layout === "expanded"
        ? "h-32 w-32 rounded-[24px]"
        : "h-14 w-14 rounded-[16px]";
}

function getSurfaceRadius(layout: FolderIconLayoutV1) {
    return layout === "expanded" ? 24 : 16;
}

export function LauncherFolderTileV1({
    displayTitle,
    icons,
    layout,
    hideLabel = layout === "expanded",
    className,
    visualClassName,
    labelClassName,
}: LauncherFolderTileV1Props) {
    const radius = getSurfaceRadius(layout);

    return (
        <div className={cn("flex flex-col items-center", hideLabel ? "gap-0" : "gap-1.5", className)}>
            <IconFrameV1
                backgroundLayer={<AppSurface variant="widget" borderRadius={radius} className="h-full w-full" />}
                className={cn(getVisualClassName(layout), visualClassName)}
            >
                <FolderIconContentV1 icons={icons} layout={layout} />
            </IconFrameV1>
            {!hideLabel ? (
                <span className={cn("w-full max-w-[80px] truncate text-center text-xs font-medium text-white drop-shadow-md select-none", labelClassName)}>
                    {displayTitle}
                </span>
            ) : null}
        </div>
    );
}

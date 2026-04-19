import { cn } from "@/shared/utils";
import type { CSSProperties } from "react";
import type { ResolvedLauncherIconV1 } from "./types";
import { IconFrameV1 } from "./IconFrameV1";
import { IconGraphicV1 } from "./IconGraphicV1";

export interface LauncherIconVisualV1Props extends React.HTMLAttributes<HTMLDivElement> {
    icon: ResolvedLauncherIconV1;
    className?: string;
    graphicClassName?: string;
    style?: CSSProperties;
    backgroundLayer?: React.ReactNode;
}

export function LauncherIconVisualV1({
    icon,
    className,
    graphicClassName,
    style,
    backgroundLayer,
    ...props
}: LauncherIconVisualV1Props) {
    return (
        <IconFrameV1
            backgroundLayer={backgroundLayer}
            className={cn(icon.frameClassName, className)}
            style={{
                backgroundColor: icon.backgroundColor ?? "transparent",
                ...style,
            }}
            {...props}
        >
            <IconGraphicV1 icon={icon} className={graphicClassName} />
        </IconFrameV1>
    );
}

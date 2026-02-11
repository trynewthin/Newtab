import type { ReactNode } from "react";
import { cn } from "@/platform/core/utils";

interface AppLayerShellProps {
    background?: ReactNode;
    content?: ReactNode;
    floating?: ReactNode;
    className?: string;
    backgroundClassName?: string;
    contentClassName?: string;
    floatingClassName?: string;
}

export function AppLayerShell({
    background,
    content,
    floating,
    className,
    backgroundClassName,
    contentClassName,
    floatingClassName,
}: AppLayerShellProps) {
    return (
        <div className={cn("relative w-full h-full overflow-hidden", className)}>
            <div className={cn("absolute inset-0 z-0", backgroundClassName)}>
                {background}
            </div>

            <div className={cn("relative z-10 h-full", contentClassName)}>
                {content}
            </div>

            <div className={cn("absolute inset-0 z-20 pointer-events-none", floatingClassName)}>
                <div className="h-full w-full pointer-events-none">
                    {floating}
                </div>
            </div>
        </div>
    );
}


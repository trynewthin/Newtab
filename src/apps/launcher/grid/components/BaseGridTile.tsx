import { cn } from "@/platform/core/utils";

interface BaseGridTileProps {
    isEditing: boolean;
    children: React.ReactNode;
    className?: string;
    contentClassName?: string;
}

// 非业务壳层：拖拽手柄、拖拽取消区域、通用容器结构都放在这里。
export function BaseGridTile({
    isEditing,
    children,
    className,
    contentClassName,
}: BaseGridTileProps) {
    return (
        <div
            className={cn("relative h-full w-full", className)}
            data-editing={isEditing ? "true" : "false"}
        >
            <div className={cn("no-grid-drag h-full w-full", contentClassName)}>
                {children}
            </div>
        </div>
    );
}

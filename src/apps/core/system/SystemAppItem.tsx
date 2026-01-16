import { cn } from "@/lib/utils";
import { ItemIcon } from "../base/ItemIcon";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export interface SystemAppItemProps {
    id: string; // 用于 DND
    title: string;
    icon: string; // 图标资源路径�?ID
    onClick: () => void;

    // DND & Interaction states
    isOverlay?: boolean;
    isNearTarget?: boolean;
    isHoverTarget?: boolean;
    className?: string;
}

export function SystemAppItem({
    id,
    title,
    icon,
    onClick,
    isOverlay,
    isNearTarget,
    isHoverTarget,
    className
}: SystemAppItemProps) {

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: id,
        disabled: !!isOverlay,
    });

    const style = {
        transform: (isNearTarget || isHoverTarget || !transform) ? undefined : CSS.Translate.toString(transform),
        transition: isDragging ? undefined : transition,
        opacity: isDragging ? 0 : 1,
        zIndex: isOverlay ? 100 : undefined,
    };

    const handleClick = (e: React.MouseEvent) => {
        if (isOverlay) {
            e.preventDefault();
            return;
        }

        e.preventDefault();
        e.stopPropagation();
        onClick();
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "group flex flex-col items-center gap-1.5 w-14",
                isOverlay && "scale-110 rotate-3 cursor-grabbing",
                className
            )}
            {...(isOverlay ? {} : attributes)}
            {...(isOverlay ? {} : listeners)}
        >
            <div className="relative">
                <ItemIcon
                    title={title}
                    icon={icon}
                    isSystem={true} // 告诉 ItemIcon 这是一个系统应用，它会处理系统图标的渲染逻辑
                    scale={1.5} // 优化系统图标展示比例
                    // 系统 App 通常使用透明背景或特定的应用背景，这里暂时保持透明或默�?
                    backgroundColor="transparent"
                    className={cn(
                        "w-14 h-14 rounded-2xl shadow-sm hover:shadow-md transition-all",
                        "cursor-pointer hover:scale-105 active:scale-95",
                        isOverlay && "cursor-grabbing shadow-xl"
                    )}
                    role="button"
                    onClick={handleClick}
                />
            </div>

            <span className="text-xs text-center font-medium truncate w-full max-w-[80px] drop-shadow-sm text-white select-none">
                {title}
            </span>
        </div>
    );
}

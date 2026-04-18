import { cn } from "@/shared/utils";
import { renderSystemIcon } from "@/launcher/ui/icons/systemIcons";
import { useMemo, useState } from "react";
import { DefaultItemIcon } from "@/launcher/ui/icons/DefaultItemIcon";
import { isDefaultItemIconValue } from "@/launcher/ui/icons/defaultItemIcon.shared";

const ITEM_ICON_CONTENT_CLASS = "w-[92%] h-[92%]";

export interface ItemIconProps extends React.HTMLAttributes<HTMLDivElement> {
    // Data Source
    title?: string;
    icon?: string;
    iconDataUrl?: string; // 优先使用
    backgroundColor?: string;
    isSystem?: boolean;
    scale?: number; // 用户定义的缩放比例

    // Appearance
    // className 已经在 HTMLAttributes 中包含
    // style 已经在 HTMLAttributes 中包含

    // Custom Content Override (例如 Folder 的 Grid)
    children?: React.ReactNode;

    // Image Handling
    fallbackIcon?: React.ReactNode; // 加载失败或无图标时显示
}

export function ItemIcon({
    title,
    icon,
    iconDataUrl,
    backgroundColor = "transparent",
    isSystem,
    scale = 1,
    className,
    style,
    children,
    fallbackIcon,
    ...props // 透传剩余的 HTML 属性 (onClick, role, tabIndex 等)
}: ItemIconProps) {
    const [failedImageSrc, setFailedImageSrc] = useState<string | null>(null);

    // Resolve Image Source
    // 逻辑：iconDataUrl (Cache) > icon (URL/Str) > Favicon Service Fallback
    const imageSrc = useMemo(() => {
        if (iconDataUrl && !iconDataUrl.startsWith("idb://")) return iconDataUrl; // IDB should be resolved by parent
        if (icon && icon.length >= 4) return icon;
        return "";
    }, [icon, iconDataUrl]);

    const hasImageContent = Boolean(imageSrc) && failedImageSrc !== imageSrc;

    // 判断是否有有效的图标内容
    const hasIconContent = Boolean((isSystem && icon) || isDefaultItemIconValue(icon) || (icon && icon.length < 4) || hasImageContent);

    const renderIconContent = () => {
        const contentStyle = { transform: `scale(${scale})` };

        // 1. System Icon
        if (isSystem && icon) {
            return (
                <div style={contentStyle} className={`flex items-center justify-center ${ITEM_ICON_CONTENT_CLASS} select-none`}>
                    {renderSystemIcon(icon, "w-full h-full")}
                </div>
            );
        }

        // 2. Emoji
        if (icon && icon.length < 4) {
            return (
                <div style={contentStyle} className={`flex items-center justify-center ${ITEM_ICON_CONTENT_CLASS}`}>
                    <span className="text-[2em] select-none leading-none flex items-center justify-center h-full w-full grayscale-0">
                        {icon}
                    </span>
                </div>
            );
        }

        // 3. Default Icon
        if (isDefaultItemIconValue(icon)) {
            return (
                <div style={contentStyle} className={`flex items-center justify-center ${ITEM_ICON_CONTENT_CLASS} text-muted-foreground/32`}>
                    <DefaultItemIcon />
                </div>
            );
        }

        // 4. Image
        if (hasImageContent) {
            return (
                <div style={contentStyle} className={`flex items-center justify-center ${ITEM_ICON_CONTENT_CLASS} select-none`}>
                    <img
                        src={imageSrc}
                        alt={title || "icon"}
                        className="w-full h-full object-cover pointer-events-none select-none"
                        onError={() => setFailedImageSrc(imageSrc)}
                    />
                </div>
            );
        }
        return null;
    };

    return (
        <div
            className={cn(
                "relative overflow-hidden flex items-center justify-center transition-all bg-cover bg-center bg-no-repeat select-none",
                isSystem && "text-muted-foreground/70",
                className
            )}
            style={{
                backgroundColor,
                ...style
            }}
            {...props}
        >
            {/* 1. Render Icon provided via props */}
            {hasIconContent && renderIconContent()}

            {/* 2. Fallback: Only if no icon AND no children (children might be content like in FolderItem) */}
            {!hasIconContent && !children && (
                <div style={{ transform: `scale(${scale})` }} className={`text-muted-foreground/20 flex items-center justify-center ${ITEM_ICON_CONTENT_CLASS} select-none`}>
                    {fallbackIcon || <DefaultItemIcon />}
                </div>
            )}

            {/* 3. Children (Overlays or Alternative Content) */}
            {children}
        </div>
    );
}


import { cn } from "@/lib/utils";
import { renderSystemIcon } from "../system/systemIcons";
import { useMemo } from "react";
import { Globe } from "lucide-react";

export interface ItemIconProps extends React.HTMLAttributes<HTMLDivElement> {
    // Data Source
    title?: string;
    icon?: string;
    iconDataUrl?: string; // 浼樺厛浣跨敤
    backgroundColor?: string;
    isSystem?: boolean;
    scale?: number; // 鐢ㄦ埛瀹氫箟鐨勭缉鏀炬瘮渚?

    // Appearance
    // className 宸茬粡鍦?HTMLAttributes 涓寘鍚?
    // style 宸茬粡鍦?HTMLAttributes 涓寘鍚?

    // Custom Content Override (渚嬪 Folder 鐨?Grid)
    children?: React.ReactNode;

    // Image Handling
    fallbackIcon?: React.ReactNode; // 鍔犺浇澶辫触鎴栨棤鍥炬爣鏃舵樉绀?
    active?: boolean; // 鏄惁澶勪簬婵€娲?閫変腑鐘舵€?
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
    active,
    ...props // 閫忎紶鍓╀綑鐨?HTML 灞炴€?(onClick, role, tabIndex 绛?
}: ItemIconProps) {

    // Resolve Image Source
    // 閫昏緫锛歩conDataUrl (Cache) > icon (URL/Str) > Favicon Service Fallback
    const imageSrc = useMemo(() => {
        if (iconDataUrl && !iconDataUrl.startsWith("idb://")) return iconDataUrl; // IDB should be resolved by parent
        if (icon && icon.length >= 4) return icon;
        return "";
    }, [icon, iconDataUrl]);

    // 鍒ゆ柇鏄惁鏈夋湁鏁堢殑鍥炬爣鍐呭
    const hasIconContent = Boolean((isSystem && icon) || (icon && icon.length < 4) || imageSrc);

    const renderIconContent = () => {
        const contentStyle = { transform: `scale(${scale})` };

        // 1. System Icon
        if (isSystem && icon) {
            return (
                <div style={contentStyle} className="flex items-center justify-center w-[85%] h-[85%]">
                    {renderSystemIcon(icon, "w-full h-full")}
                </div>
            );
        }

        // 2. Emoji
        if (icon && icon.length < 4) {
            return (
                <div style={contentStyle} className="flex items-center justify-center w-[85%] h-[85%]">
                    <span className="text-[2em] select-none leading-none flex items-center justify-center h-full w-full grayscale-0">
                        {icon}
                    </span>
                </div>
            );
        }

        // 3. Image
        if (imageSrc) {
            return (
                <div style={contentStyle} className="w-[85%] h-[85%] flex items-center justify-center">
                    <img
                        src={imageSrc}
                        alt={title || "icon"}
                        className="w-full h-full object-contain pointer-events-none select-none"
                        onError={(e) => {
                            e.currentTarget.style.display = 'none';
                        }}
                    />
                </div>
            );
        }
        return null;
    };

    return (
        <div
            className={cn(
                "relative overflow-hidden flex items-center justify-center transition-all bg-cover bg-center bg-no-repeat",
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
                <div style={{ transform: `scale(${scale})` }} className="text-muted-foreground/20 flex items-center justify-center w-[85%] h-[85%]">
                    {fallbackIcon || <Globe className="w-full h-full" />}
                </div>
            )}

            {/* 3. Children (Overlays or Alternative Content) */}
            {children}
        </div>
    );
}

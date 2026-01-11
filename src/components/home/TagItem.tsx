import { useAppStore, type Tag } from "@/lib/store";
import { X, Edit2 } from "lucide-react";
import { useState, useEffect } from "react";
import { extractDominantColor, loadImageAsDataUrl } from "@/lib/colorExtractor";
import { cn } from "@/lib/utils";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface TagItemProps {
    tag: Tag;
    onEdit: (tag: Tag) => void;
    isOverlay?: boolean;
}

export function TagItem({ tag, onEdit, isOverlay }: TagItemProps) {
    const removeTag = useAppStore((state) => state.removeTag);
    const theme = useAppStore((state) => state.theme);
    const isEditing = useAppStore((state) => state.isEditing);
    const [bgColor, setBgColor] = useState("rgba(255, 255, 255, 0.9)");
    const [imageDataUrl, setImageDataUrl] = useState<string>("");

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: tag.id,
        disabled: !isEditing || !!isOverlay,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition: transition || 'transform 500ms cubic-bezier(0.2, 0, 0, 1)',
        opacity: isDragging ? 0 : 1,
        // Overlay 状态显示在最上层
        zIndex: isOverlay ? 100 : undefined,
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (confirm(`Delete shortcut "${tag.title}"?`)) {
            removeTag(tag.id);
        }
    };

    const handleEdit = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onEdit(tag);
    };

    const faviconUrl = tag.icon || `https://www.google.com/s2/favicons?domain=${tag.url}&sz=128`;

    // 判断是否为深色模式
    const isDarkMode = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    useEffect(() => {
        if (tag.icon && tag.icon.length < 4) {
            setBgColor(isDarkMode ? "rgba(0, 0, 0, 0.9)" : "rgba(255, 255, 255, 0.9)");
            setImageDataUrl("");
            return;
        }

        const loadAndAnalyze = async () => {
            try {
                const dataUrl = await loadImageAsDataUrl(faviconUrl);
                setImageDataUrl(dataUrl);

                const img = new Image();
                img.onload = () => {
                    const color = extractDominantColor(img, isDarkMode);
                    setBgColor(color);
                };
                img.src = dataUrl;
            } catch (error) {
                console.error('Failed to process image:', error);
                setImageDataUrl(faviconUrl);
                setBgColor(isDarkMode ? "rgba(0, 0, 0, 0.9)" : "rgba(255, 255, 255, 0.9)");
            }
        };

        loadAndAnalyze();
    }, [tag.url, tag.icon, faviconUrl, isDarkMode]);

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "group relative flex flex-col items-center gap-1.5",
                isEditing && !isDragging && !isOverlay && "animate-[shake_0.5s_ease-in-out_infinite]",
                isOverlay && "scale-110 rotate-3 cursor-grabbing"
            )}
            {...(isOverlay ? {} : attributes)}
            {...(isOverlay ? {} : listeners)}
        >
            {/* 操作按钮容器 */}
            <div className={cn(
                "absolute -top-2 right-2 flex gap-1 transition-all z-20 p-1 rounded-full bg-background/50 backdrop-blur-md border shadow-sm",
                (isEditing && !isOverlay) ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
            )}>
                <button
                    onClick={handleEdit}
                    className="p-1 bg-primary text-primary-foreground rounded-full shadow-sm hover:scale-110 transition-transform cursor-pointer"
                    title="Edit"
                >
                    <Edit2 size={10} />
                </button>
                <button
                    onClick={handleDelete}
                    className="p-1 bg-destructive text-destructive-foreground rounded-full shadow-sm hover:scale-110 transition-transform cursor-pointer"
                    title="Remove"
                >
                    <X size={10} />
                </button>
            </div>

            <a
                href={tag.url}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => (isEditing || isOverlay) && e.preventDefault()}
                className={cn(
                    "flex items-center justify-center w-14 h-14 rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden",
                    isEditing ? "cursor-move" : "cursor-pointer",
                    isOverlay && "cursor-grabbing shadow-xl"
                )}
                style={{ backgroundColor: bgColor }}
            >
                {tag.icon && tag.icon.length < 4 ? (
                    <span className="text-2xl">{tag.icon}</span>
                ) : (
                    <img
                        src={imageDataUrl || faviconUrl}
                        alt={tag.title}
                        className="w-9 h-9 object-contain pointer-events-none"
                    />
                )}
            </a>

            <span className="text-xs text-center font-medium truncate w-full max-w-[80px] drop-shadow-sm text-foreground/80 group-hover:text-foreground">
                {tag.title}
            </span>
        </div>
    );
}

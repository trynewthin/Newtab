import { useAppStore, type Tag } from "@/lib/store";
import { X, Edit2 } from "lucide-react";
import { useState, useEffect } from "react";
import { extractDominantColor, loadImageAsDataUrl } from "@/lib/colorExtractor";

interface TagItemProps {
    tag: Tag;
    onEdit: (tag: Tag) => void;
}

export function TagItem({ tag, onEdit }: TagItemProps) {
    const removeTag = useAppStore((state) => state.removeTag);
    const theme = useAppStore((state) => state.theme);
    const [bgColor, setBgColor] = useState("rgba(255, 255, 255, 0.9)");
    const [imageDataUrl, setImageDataUrl] = useState<string>("");

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
        // Emoji 使用主题色背景
        if (tag.icon && tag.icon.length < 4) {
            setBgColor(isDarkMode ? "rgba(0, 0, 0, 0.9)" : "rgba(255, 255, 255, 0.9)");
            setImageDataUrl("");
            return;
        }

        // 加载并分析 favicon
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
        <div className="group relative flex flex-col items-center gap-1.5">
            <div className="absolute -top-1 -right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                <button
                    onClick={handleEdit}
                    className="p-1 bg-primary text-primary-foreground rounded-full shadow-sm hover:scale-110 transition-transform"
                    title="Edit"
                >
                    <Edit2 size={10} />
                </button>
                <button
                    onClick={handleDelete}
                    className="p-1 bg-destructive text-destructive-foreground rounded-full shadow-sm hover:scale-110 transition-transform"
                    title="Remove"
                >
                    <X size={10} />
                </button>
            </div>

            <a
                href={tag.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center w-14 h-14 rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden"
                style={{ backgroundColor: bgColor }}
            >
                {tag.icon && tag.icon.length < 4 ? (
                    <span className="text-2xl">{tag.icon}</span>
                ) : (
                    <img
                        src={imageDataUrl || faviconUrl}
                        alt={tag.title}
                        className="w-9 h-9 object-contain"
                    />
                )}
            </a>

            <span className="text-xs text-center font-medium truncate w-full max-w-[80px] drop-shadow-sm text-foreground/80 group-hover:text-foreground">
                {tag.title}
            </span>
        </div>
    );
}

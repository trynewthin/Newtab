import { useState, useEffect } from "react";
import { useAppStore, type Tag } from "@/lib/store";
import {
    Dialog,
    DialogContent,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Globe } from "lucide-react";
import { extractDominantColor } from "@/lib/colorExtractor";

interface AddTagDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editTag?: Tag | null;
}

export function AddTagDialog({ open, onOpenChange, editTag }: AddTagDialogProps) {
    const [url, setUrl] = useState("");
    const [title, setTitle] = useState("");
    const [icon, setIcon] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const addTag = useAppStore((state) => state.addTag);
    const updateTag = useAppStore((state) => state.updateTag);

    // 同步编辑状态
    useEffect(() => {
        if (open) {
            if (editTag) {
                setUrl(editTag.url);
                setTitle(editTag.title);
                setIcon(editTag.icon || "");
            } else {
                setUrl("");
                setTitle("");
                setIcon("");
            }
        }
    }, [open, editTag]);

    // 自动根据网址获取名称逻辑
    useEffect(() => {
        if (url && !title) {
            try {
                const urlInfo = new URL(url.startsWith("http") ? url : `https://${url}`);
                const hostname = urlInfo.hostname.replace("www.", "");
                if (hostname && hostname !== "localhost") {
                    setTitle(hostname.charAt(0).toUpperCase() + hostname.slice(1));
                }
            } catch { }
        }
    }, [url, title]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!url || !title) return;

        setIsSubmitting(true);
        let backgroundColor = editTag?.backgroundColor;

        // Determine image URL
        // Prioritize custom icon, then favicon
        // Only re-calc if URL/Icon changed or if no background color exists
        const imgUrl = icon || (url ? `https://www.google.com/s2/favicons?domain=${url}&sz=128` : "");
        const shouldExtract = !backgroundColor || (editTag && (editTag.url !== url || editTag.icon !== icon));

        if (imgUrl && shouldExtract) {
            try {
                backgroundColor = await new Promise<string | undefined>((resolve) => {
                    const img = new Image();
                    img.crossOrigin = "Anonymous";
                    img.src = imgUrl;

                    img.onload = () => {
                        try {
                            const color = extractDominantColor(img);
                            resolve(color);
                        } catch (e) {
                            console.warn("Color extraction failed (likely CORS):", e);
                            resolve(undefined);
                        }
                    };

                    img.onerror = () => {
                        resolve(undefined);
                    };

                    // Timeout to prevent hanging
                    setTimeout(() => resolve(undefined), 2000);
                });
            } catch (error) {
                console.error("Color extraction process failed:", error);
            }
        }

        const data = {
            title,
            url: url.startsWith("http") ? url : `https://${url}`,
            icon: icon || undefined,
            backgroundColor,
        };

        if (editTag) {
            updateTag(editTag.id, data);
        } else {
            addTag(data);
        }

        setIsSubmitting(false);
        onOpenChange(false);
    };

    const faviconUrl = (url && !icon) ? `https://www.google.com/s2/favicons?domain=${url}&sz=128` : "";

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden">
                <form onSubmit={handleSubmit} className="flex flex-col gap-8 p-8 pt-12">
                    {/* 顶部：居中图标预览 */}
                    <div className="flex justify-center">
                        <div className="w-24 h-24 flex items-center justify-center bg-muted/30 rounded-3xl border-2 border-transparent shadow-inner overflow-hidden">
                            <div className="text-5xl">
                                {icon && icon.length < 4 ? (
                                    icon
                                ) : icon ? (
                                    <img src={icon} alt="Preview" className="w-14 h-14 object-contain" />
                                ) : faviconUrl ? (
                                    <img src={faviconUrl} alt="Preview" className="w-14 h-14 object-contain" />
                                ) : (
                                    <Globe className="w-12 h-12 text-muted-foreground/20" />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 下部：表单输入 (上下排列) */}
                    <div className="grid gap-5">
                        <div className="grid gap-2">
                            <Label htmlFor="title" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 ml-1">名称</Label>
                            <Input
                                id="title"
                                placeholder="网站名称"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                                className="h-11 border-input bg-background focus-visible:ring-primary/20 shadow-sm rounded-xl"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="url" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 ml-1">网址</Label>
                            <Input
                                id="url"
                                placeholder="https://example.com"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                required
                                className="h-11 border-input bg-background focus-visible:ring-primary/20 shadow-sm rounded-xl"
                            />
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:justify-end">
                        <Button type="button" variant="ghost" className="text-muted-foreground h-11 px-6 rounded-xl" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                            取消
                        </Button>
                        <Button type="submit" className="font-bold h-11 px-8 rounded-xl shadow-lg shadow-primary/10" disabled={isSubmitting}>
                            {isSubmitting ? "保存中..." : (editTag ? "保存修改" : "确认添加")}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

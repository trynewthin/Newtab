import { useState, useEffect, useMemo } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { extractDominantColor, loadImageAsDataUrl } from "@/lib/colorExtractor";
import { backgroundStorage, getIconKey, isDataURL } from "@/store/core/backgroundStorage";

export default function Popup() {
    const [url, setUrl] = useState("");
    const [title, setTitle] = useState("");
    const [iconStr, setIconStr] = useState(""); // Avoid collision with Lucide component
    const [initialIcon, setInitialIcon] = useState("");
    const [isExisting, setIsExisting] = useState(false);
    const [existingId, setExistingId] = useState<string | null>(null);
    const [previewBg, setPreviewBg] = useState<string>("rgb(255, 255, 255)");
    const [previewIcon, setPreviewIcon] = useState<string>("");
    const [validIcons, setValidIcons] = useState<string[]>([]);

    const tags = useAppStore((state) => state.tags);
    const addTag = useAppStore((state) => state.addTag);
    const updateTag = useAppStore((state) => state.updateTag);
    const theme = useAppStore((state) => state.theme);

    // Sync Theme
    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove("light", "dark");

        const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        const effectiveTheme = theme === "system" ? systemTheme : theme;

        root.classList.add(effectiveTheme);

        // Force Popup Size
        document.documentElement.style.width = "350px";
        document.documentElement.style.height = "328px";
        document.body.style.width = "348px";
        document.body.style.height = "328px";
    }, [theme]);

    // Initialize: Sync with Chrome storage and get current tab
    useEffect(() => {
        // Force hydration from chrome.storage if possible, though Zustand persist attempts it automatically.
        // We rely on useAppStore logic which uses our adapter.

        if (typeof chrome !== "undefined" && chrome.tabs) {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                const activeTab = tabs[0];
                if (activeTab) {
                    const tabUrl = activeTab.url || "";
                    const tabTitle = activeTab.title || "";
                    const tabIcon = activeTab.favIconUrl || "";

                    setUrl(tabUrl);
                    setTitle(tabTitle);
                    setIconStr(tabIcon);
                    setInitialIcon(tabIcon);

                    // Check if already exists
                    // We need to wait for store hydration, but since we are in a popup, maybe it's fresh.
                    // Let's assume tags are loaded.
                }
            });
        }
    }, []);

    // Check existence when url or tags change
    useEffect(() => {
        if (!url) return;
        // Simple normalization for check
        const normUrl = url.replace(/\/$/, "");
        const found = tags.find(t => t.url.replace(/\/$/, "") === normUrl);
        if (found) {
            setIsExisting(true);
            setExistingId(found.id);
            // Optionally override title/icon with found ones if user hasn't edited yet?
            // Let's keep current tab info as default for "Update" unless user explicitly fetched.
            // But maybe better to show what's in store?
            // Let's stick to "Current Tab Info" as primary source for update.
        } else {
            setIsExisting(false);
            setExistingId(null);
        }
    }, [url, tags]);

    const [isSuccess, setIsSuccess] = useState(false);

    const checkIcon = (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center shadow-lg animate-in zoom-in spin-in-12 duration-300">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
            </div>
            <p className="mt-4 text-lg font-bold text-foreground animate-in slide-in-from-bottom-2 duration-300">
                {isExisting ? "Updated!" : "Added!"}
            </p>
        </div>
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!url || !title) return;

        let iconDataUrl: string | undefined;
        let backgroundColor: string | undefined = previewBg;

        // 如果预览里已有 dataURL，尝试下沉到 IndexedDB
        if (previewIcon && isDataURL(previewIcon)) {
            const key = getIconKey();
            await backgroundStorage.saveIcon(key, previewIcon);
            iconDataUrl = `idb://${key}`;
        } else if (previewIcon) {
            iconDataUrl = previewIcon; // 可能是 http/https data，不下沉
        }

        const data = {
            title,
            url,
            icon: iconStr || undefined,
            iconDataUrl,
            backgroundColor,
        };

        if (isExisting && existingId) {
            updateTag(existingId, data);
        } else {
            addTag(data);
        }

        setIsSuccess(true);

        setTimeout(() => {
            window.close();
        }, 800);
    };

    const hostname = useMemo(() => {
        try {
            const u = url.startsWith("http") ? url : `https://${url}`;
            return new URL(u).hostname.replace("www.", "");
        } catch {
            return "";
        }
    }, [url]);

    const iconCandidates = useMemo(() => {
        const list = [
            initialIcon || "",
            hostname ? `https://www.google.com/s2/favicons?domain=${hostname}&sz=256` : "",
            hostname ? `https://www.google.com/s2/favicons?domain=${hostname}&sz=128` : "",
            hostname ? `https://logo.clearbit.com/${hostname}` : "",
            hostname ? `https://icons.duckduckgo.com/ip3/${hostname}.ico` : "",
        ].filter(Boolean);
        return Array.from(new Set(list));
    }, [initialIcon, hostname]);

    // 预筛选可用 icon，剔除加载失败；默认选用列表第一项（高分辨率在前），不因选择变化而重排
    useEffect(() => {
        let cancelled = false;
        const validate = async () => {
            const results: string[] = [];
            await Promise.all(
                iconCandidates.map(
                    (src) =>
                        new Promise<void>((resolve) => {
                            if (!src) return resolve();
                            const img = new Image();
                            img.crossOrigin = "Anonymous";
                            img.onload = () => {
                                if (!cancelled) results.push(src);
                                resolve();
                            };
                            img.onerror = () => resolve();
                            img.src = src;
                            setTimeout(resolve, 1500);
                        })
                )
            );
            if (cancelled) return;
            setValidIcons(results);
            // 如果当前未选或当前选中无效，则选第一个有效（最高分辨率）
            if (results.length && (!iconStr || !results.includes(iconStr))) {
                setIconStr(results[0]);
            }
        };
        validate();
        return () => { cancelled = true; };
        // 仅依赖候选列表，避免因选择变化触发重排
    }, [iconCandidates]);

    // 选中后立即取色，更新预览
    useEffect(() => {
        let cancelled = false;
        const extract = async () => {
            if (!iconStr) return;
            // 先展示原链接作为占位
            setPreviewIcon(iconStr);

            const runExtraction = (src: string) =>
                new Promise<void>((resolve) => {
                    const img = new Image();
                    img.crossOrigin = "Anonymous";
                    img.src = src;
                    img.onload = () => {
                        try {
                            const color = extractDominantColor(img);
                            if (!cancelled) {
                                setPreviewBg(color);
                            }
                        } catch {
                            if (!cancelled) setPreviewBg("rgb(255, 255, 255)");
                        }
                        resolve();
                    };
                    img.onerror = () => {
                        if (!cancelled) setPreviewBg("rgb(255, 255, 255)");
                        resolve();
                    };
                    setTimeout(() => resolve(), 1500);
                });

            try {
                if (iconStr.startsWith("data:")) {
                    await runExtraction(iconStr);
                    if (!cancelled) setPreviewIcon(iconStr);
                    return;
                }

                // 先尝试直接用原链接取色（避免 fetch 失败）
                await runExtraction(iconStr);
                if (cancelled) return;

                // 再尝试拉取 dataURL，提升成功率
                const dataUrl = await loadImageAsDataUrl(iconStr);
                if (cancelled) return;
                setPreviewIcon(dataUrl);
                await runExtraction(dataUrl);
            } catch {
                if (!cancelled) {
                    setPreviewBg("rgb(255, 255, 255)");
                }
            }
        };
        extract();
        return () => { cancelled = true; };
    }, [iconStr]);

    return (
        <div className="w-[350px] h-[380px] bg-background text-foreground overflow-hidden flex flex-col relative">
            {isSuccess && checkIcon}
            <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-5">
                {/* 单行选择 + 预览（无独立背景框） */}
                {validIcons.length > 0 ? (
                    <div className="flex justify-center">
                        <div className="flex gap-3 py-2 px-1 flex-nowrap no-scrollbar overflow-x-auto">
                            {validIcons.map((src) => {
                                const active = src === iconStr;
                                return (
                                    <button
                                        key={src}
                                        type="button"
                                        onClick={() => setIconStr(src)}
                                        className={`relative shrink-0 w-12 h-12 rounded-lg border bg-card flex items-center justify-center transition-all duration-300 ${active ? "border-primary shadow-md scale-110" : "border-border hover:shadow-sm"
                                            }`}
                                        title={src}
                                    >
                                        <img src={src} alt="cand" className="w-10 h-10 object-contain" />
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <div className="flex justify-center">
                        <div className="flex gap-3 py-2 px-1 flex-nowrap">
                            {Array.from({ length: 4 }).map((_, idx) => (
                                <div
                                    key={idx}
                                    className="w-12 h-12 rounded-lg border border-border bg-muted/30 animate-pulse"
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Form Fields */}
                <div className="grid gap-4">
                    <div className="grid gap-1.5">
                        <Label htmlFor="title" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 ml-1">Title</Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                            className="h-9 text-sm rounded-lg"
                        />
                    </div>
                    <div className="grid gap-1.5">
                        <Label htmlFor="url" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 ml-1">URL</Label>
                        <Input
                            id="url"
                            value={url}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUrl(e.target.value)}
                            className="h-9 text-sm rounded-lg text-muted-foreground"
                        />
                    </div>
                </div>

                {/* Actions */}
                <Button type="submit" className="w-full font-bold h-10 rounded-xl shadow-lg shadow-primary/10 mt-2">
                    {isExisting ? "Update Bookmark" : "Add to New Tab"}
                </Button>
            </form>
        </div>
    );
}

import { useState, useEffect, useMemo, useRef, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ItemIcon } from "../components/ItemIcon";
import { extractDominantColor, loadImageAsDataUrl } from "@/core/colorExtractor";
import { backgroundStorage, getIconKey, isDataURL } from "@/state/core/backgroundStorage";
import { cn, parseColor } from "@/core/utils";
import type { WebTagItem } from "@/state/core/itemTypes";
import { useTranslation } from "react-i18next";

export interface TagConfigData {
    title: string;
    url: string;
    icon?: string;
    iconDataUrl?: string;
    backgroundColor?: string;
    iconSize?: number;
}

interface TagConfigFormProps {
    defaultValues?: Partial<WebTagItem>;
    onSubmit: (data: TagConfigData) => Promise<void>;
    showUrlField?: boolean;
    autoFocus?: boolean;
    children?: ReactNode; // 用于渲染按钮区域
}

export function TagConfigForm({
    defaultValues,
    onSubmit,
    showUrlField = true,
    autoFocus = false,
    children
}: TagConfigFormProps) {
    const { t } = useTranslation();

    // Form States
    const [url, setUrl] = useState(defaultValues?.url || "");
    const [title, setTitle] = useState(defaultValues?.title || "");
    const [iconStr, setIconStr] = useState(defaultValues?.icon || "");
    const [iconSize, setIconSize] = useState(defaultValues?.iconSize || 1.0);

    // Color States
    const { hex: initHex, alpha: initAlpha } = parseColor(defaultValues?.backgroundColor || "rgb(255, 255, 255)");
    const [colorHex, setColorHex] = useState(initHex);
    const [colorAlpha, setColorAlpha] = useState(initAlpha);

    // Derived States
    const [validIcons, setValidIcons] = useState<string[]>([]);
    const [previewIcon, setPreviewIcon] = useState<string>(defaultValues?.iconDataUrl || "");

    const composedColor = `rgba(${parseInt(colorHex.slice(1, 3), 16)}, ${parseInt(colorHex.slice(3, 5), 16)}, ${parseInt(colorHex.slice(5, 7), 16)}, ${colorAlpha / 100})`;

    // Sync with defaultValues if they change externally (important for Popup where defaultValues load async)
    useEffect(() => {
        if (defaultValues?.url) setUrl(defaultValues.url);
        if (defaultValues?.title) setTitle(defaultValues.title);
        if (defaultValues?.icon) setIconStr(defaultValues.icon);
        if (defaultValues?.iconSize) setIconSize(defaultValues.iconSize);
        if (defaultValues?.backgroundColor) {
            const { hex, alpha } = parseColor(defaultValues.backgroundColor);
            setColorHex(hex);
            setColorAlpha(alpha);
        }
    }, [defaultValues]);

    // Load initial IDB icon if needed
    useEffect(() => {
        let cancelled = false;
        const loadIdbIcon = async () => {
            if (defaultValues?.iconDataUrl?.startsWith("idb://")) {
                const key = defaultValues.iconDataUrl.replace("idb://", "");
                try {
                    const data = await backgroundStorage.getIcon(key);
                    if (!cancelled && data) setPreviewIcon(data);
                } catch (e) {
                    console.error(e);
                }
            } else if (defaultValues?.iconDataUrl) {
                setPreviewIcon(defaultValues.iconDataUrl);
            }
        };
        loadIdbIcon();
        return () => { cancelled = true; };
    }, [defaultValues?.iconDataUrl]);

    // Hostname for icon fetching
    const hostname = useMemo(() => {
        try {
            const u = url.startsWith("http") ? url : `https://${url}`;
            return new URL(u).hostname.replace("www.", "");
        } catch { return ""; }
    }, [url]);

    // Auto title from hostname if empty
    useEffect(() => {
        if (hostname && !title && !defaultValues?.title) {
            setTitle(hostname.charAt(0).toUpperCase() + hostname.slice(1));
        }
    }, [hostname, title, defaultValues?.title]);

    // Icon Candidates
    const iconCandidates = useMemo(() => {
        const list = [
            defaultValues?.icon || "", // Original icon
            hostname ? `https://www.google.com/s2/favicons?domain=${hostname}&sz=256` : "",
            hostname ? `https://www.google.com/s2/favicons?domain=${hostname}&sz=128` : "",
            hostname ? `https://logo.clearbit.com/${hostname}` : "",
            hostname ? `https://icons.duckduckgo.com/ip3/${hostname}.ico` : "",
        ].filter(Boolean);
        return Array.from(new Set(list));
    }, [defaultValues?.icon, hostname]);

    // Validating State
    const [isValidating, setIsValidating] = useState(false);

    // Validate Icons — only re-run when candidates change, NOT when iconStr changes
    const hasAutoSelected = useRef(false);
    useEffect(() => {
        let cancelled = false;
        hasAutoSelected.current = false;

        const validate = async () => {
            setIsValidating(true);
            const valid = new Set<string>();
            await Promise.all(
                iconCandidates.map(src => new Promise<void>((resolve) => {
                    const img = new Image();
                    img.crossOrigin = "Anonymous";
                    img.src = src;
                    img.onload = () => { if (!cancelled) valid.add(src); resolve(); };
                    img.onerror = () => resolve();
                }))
            );
            if (cancelled) return;
            // Preserve candidate order so icons don't jump
            const ordered = iconCandidates.filter(src => valid.has(src));
            setValidIcons(ordered);
            setIsValidating(false);

            // Auto-select first valid icon only once per candidate set
            if (ordered.length > 0 && !hasAutoSelected.current) {
                hasAutoSelected.current = true;
                setIconStr(prev => prev || ordered[0]);
            }
        };

        if (iconCandidates.length > 0) {
            validate();
        } else {
            setValidIcons([]);
            setIsValidating(false);
        }

        return () => { cancelled = true; };
    }, [iconCandidates]);

    // Auto-extract color when icon changes
    useEffect(() => {
        let cancelled = false;
        if (!iconStr) return;

        // Always update preview icon so switching back works
        setPreviewIcon(iconStr);

        const extract = async () => {
            try {
                const img = new Image();
                img.crossOrigin = "Anonymous";
                img.src = iconStr;
                await new Promise<void>((resolve, reject) => {
                    img.onload = () => resolve();
                    img.onerror = () => reject();
                });

                const color = extractDominantColor(img);
                if (!cancelled) {
                    const { hex, alpha } = parseColor(color);
                    setColorHex(hex);
                    setColorAlpha(alpha);
                }
            } catch { } // Ignore errors
        };
        extract();
        return () => { cancelled = true; };
    }, [iconStr, defaultValues?.icon]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || (!url && showUrlField)) return;

        let iconDataUrl = defaultValues?.iconDataUrl;
        const isIconChanged = iconStr !== defaultValues?.icon;

        if (iconStr) {
            if (isIconChanged || !iconDataUrl) {
                try {
                    // 添加超时设置，防止 fetch 挂起
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 3000);

                    const dataUrl = await loadImageAsDataUrl(iconStr).catch(() => null);
                    clearTimeout(timeoutId);

                    if (dataUrl && isDataURL(dataUrl)) {
                        const key = getIconKey();
                        await backgroundStorage.saveIcon(key, dataUrl);
                        iconDataUrl = `idb://${key}`;
                    } else {
                        iconDataUrl = iconStr; // Fallback
                    }
                } catch {
                    iconDataUrl = iconStr;
                }
            }
        } else {
            iconDataUrl = undefined;
        }

        await onSubmit({
            title,
            url,
            icon: iconStr || undefined,
            iconDataUrl,
            backgroundColor: composedColor,
            iconSize
        });
    };

    const faviconUrl = !iconStr && url ? `https://www.google.com/s2/favicons?domain=${url}&sz=128` : "";
    const effectivePreviewIcon = previewIcon || iconStr || faviconUrl;

    return (
        <form id="tag-config-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Top Row: Preview + selection */}
            <div className="flex gap-3 items-stretch h-20">
                <ItemIcon
                    icon={iconStr}
                    iconDataUrl={effectivePreviewIcon}
                    scale={iconSize}
                    backgroundColor={composedColor}
                    className="shrink-0 w-20 h-20 rounded-2xl border-2 border-transparent shadow-md ring-4 ring-background/50"
                />

                {/* Right: Icon Selection List */}
                <div className="flex-1 h-20 rounded-xl border border-border/40 p-1.5 overflow-y-auto custom-scrollbar">
                    {validIcons.length > 0 ? (
                        <div className="grid grid-cols-[repeat(auto-fill,minmax(2.5rem,1fr))] gap-2">
                            {validIcons.map((src) => {
                                const active = src === iconStr;
                                return (
                                    <button
                                        key={src}
                                        type="button"
                                        onClick={() => setIconStr(src)}
                                        className={cn(
                                            "relative aspect-square rounded-lg flex items-center justify-center transition-all duration-200",
                                            active ? "bg-primary/10 ring-2 ring-primary/20" : "hover:bg-accent/50 opacity-70 hover:opacity-100"
                                        )}
                                    >
                                        <img src={src} alt="icon" className="w-5 h-5 object-contain" />
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground/50">
                            {isValidating ? (
                                <div className="flex flex-col items-center gap-1">
                                    <div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                                </div>
                            ) : (
                                t('no_icons_found')
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* 2. Appearance Config */}
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5 border border-border/50 rounded-xl p-2.5 overflow-hidden">
                    <div className="flex justify-between items-center">
                        <Label className="text-[10px] uppercase font-bold text-muted-foreground/70">{t('scale')}</Label>
                        <span className="text-[10px] font-mono opacity-50">{Math.round(iconSize * 100)}%</span>
                    </div>
                    <input
                        type="range"
                        min="0.75"
                        max="1.75"
                        step="0.05"
                        value={iconSize}
                        onChange={(e) => setIconSize(parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
                    />
                </div>
                <div className="space-y-1.5 border border-border/50 rounded-xl p-2.5 overflow-hidden">
                    <div className="flex justify-between items-center">
                        <Label className="text-[10px] uppercase font-bold text-muted-foreground/70">{t('background')}</Label>
                        <span className="text-[10px] font-mono opacity-50">{colorAlpha}%</span>
                    </div>
                    <div className="flex gap-2 items-center">
                        <div className="relative shrink-0 w-6 h-6 rounded-full overflow-hidden border border-border shadow-sm ring-1 ring-border/20">
                            <input
                                type="color"
                                value={colorHex}
                                onChange={(e) => setColorHex(e.target.value)}
                                className="absolute inset-[-4px] w-[200%] h-[200%] cursor-pointer p-0 m-0"
                            />
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={colorAlpha}
                            onChange={(e) => setColorAlpha(parseInt(e.target.value))}
                            className="flex-1 min-w-0 h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
                            style={{
                                background: `linear-gradient(to right, transparent, ${colorHex})`
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* 3. Basic Fields */}
            <div className="grid gap-3">
                <div className="grid gap-1">
                    <Label htmlFor="title" className="text-[10px] uppercase tracking-wider text-muted-foreground/80 font-bold ml-1">{t('name')}</Label>
                    <Input
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        className="h-9 bg-secondary/30"
                        placeholder={t('site_name_placeholder')}
                        autoFocus={autoFocus}
                    />
                </div>

                {showUrlField && (
                    <div className="grid gap-1">
                        <Label htmlFor="url" className="text-[10px] uppercase tracking-wider text-muted-foreground/80 font-bold ml-1">{t('url')}</Label>
                        <Input
                            id="url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            required
                            className="h-9 bg-secondary/30 text-muted-foreground font-mono text-xs"
                            placeholder={t('url_placeholder')}
                        />
                    </div>
                )}
            </div>

            {children}
        </form>
    );
}

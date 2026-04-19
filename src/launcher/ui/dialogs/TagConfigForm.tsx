import { useState, useEffect, useMemo, useRef, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LauncherIconVisualV1 } from "@/launcher/ui/icon-system-v1";
import type { ResolvedLauncherIconV1 } from "@/launcher/ui/icon-system-v1";
import { LAUNCHER_ICON_VISUAL_LARGE_CLASS_V1 } from "@/launcher/ui/icon-system-v1/iconVisualStyles";
import { extractDominantColor, loadImageAsDataUrl } from "@/core/colorExtractor";
import { backgroundStorage, getIconKey, isDataURL } from "@/platform/storage/backgroundStorage";
import { cn, parseColor } from "@/shared/utils";
import type { WebTagItem } from "@/launcher/model/itemTypes";
import { useTranslation } from "react-i18next";
import { DEFAULT_ITEM_ICON_VALUE, isDefaultItemIconValue } from "@/launcher/ui/icons/defaultItemIcon.shared";
import { resolveItemIconScale } from "../components/itemIconScale.shared";

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

function resolvePreviewIconV1(
    icon: string | undefined,
    imageSrc: string | undefined,
    backgroundColor: string,
    scale: number
): ResolvedLauncherIconV1 {
    if (icon && isDefaultItemIconValue(icon)) {
        return {
            title: "default",
            kind: "default",
            backgroundColor,
            scale,
        };
    }

    if (icon && icon.length < 4) {
        return {
            title: "emoji",
            kind: "emoji",
            value: icon,
            backgroundColor,
            scale,
        };
    }

    if (imageSrc) {
        return {
            title: "image",
            kind: "image",
            value: imageSrc,
            backgroundColor,
            scale,
        };
    }

    return {
        title: "default",
        kind: "default",
        backgroundColor,
        scale,
    };
}

export function TagConfigForm({
    defaultValues,
    onSubmit,
    showUrlField = true,
    autoFocus = false,
    children
}: TagConfigFormProps) {
    const { t } = useTranslation();
    const initialBackgroundColor = defaultValues?.backgroundColor || "rgb(255, 255, 255)";
    const { hex: initHex, alpha: initAlpha } = parseColor(initialBackgroundColor);

    // Form States
    const [url, setUrl] = useState(defaultValues?.url || "");
    const [title, setTitle] = useState(defaultValues?.title || "");
    const [iconStr, setIconStr] = useState(defaultValues?.icon || "");
    const [iconSize, setIconSize] = useState(resolveItemIconScale(defaultValues?.iconSize));

    // Color States
    const [colorHex, setColorHex] = useState(initHex);
    const [colorAlpha, setColorAlpha] = useState(initAlpha);

    // Derived States
    const [validIcons, setValidIcons] = useState<string[]>([]);
    const [resolvedPreviewIcon, setResolvedPreviewIcon] = useState<string>("");

    const composedColor = `rgba(${parseInt(colorHex.slice(1, 3), 16)}, ${parseInt(colorHex.slice(3, 5), 16)}, ${parseInt(colorHex.slice(5, 7), 16)}, ${colorAlpha / 100})`;

    // Load initial IDB icon if needed
    useEffect(() => {
        let cancelled = false;
        const loadIdbIcon = async () => {
            if (defaultValues?.iconDataUrl?.startsWith("idb://")) {
                const key = defaultValues.iconDataUrl.replace("idb://", "");
                try {
                    const data = await backgroundStorage.getIcon(key);
                    if (!cancelled) {
                        setResolvedPreviewIcon(data ?? "");
                    }
                } catch (error) {
                    console.error(error);
                }
            }
        };
        void loadIdbIcon();
        return () => { cancelled = true; };
    }, [defaultValues?.iconDataUrl]);

    // Hostname for icon fetching
    const hostname = useMemo(() => {
        try {
            const u = url.startsWith("http") ? url : `https://${url}`;
            return new URL(u).hostname.replace("www.", "");
        } catch { return ""; }
    }, [url]);

    // Icon Candidates
    const iconCandidates = useMemo(() => {
        const list = [
            defaultValues?.icon || "", // Original icon
            hostname ? `https://www.google.com/s2/favicons?domain=${hostname}&sz=256` : "",
            hostname ? `https://www.google.com/s2/favicons?domain=${hostname}&sz=128` : "",
            hostname ? `https://logo.clearbit.com/${hostname}` : "",
            hostname ? `https://icons.duckduckgo.com/ip3/${hostname}.ico` : "",
            DEFAULT_ITEM_ICON_VALUE,
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
                    if (isDefaultItemIconValue(src)) {
                        valid.add(src);
                        resolve();
                        return;
                    }

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
                const preferredIcon = ordered.find((src) => !isDefaultItemIconValue(src));
                if (preferredIcon) {
                    setIconStr((prev) => prev || preferredIcon);
                }
            }
        };

        if (iconCandidates.length === 0) return;
        void validate();

        return () => { cancelled = true; };
    }, [iconCandidates]);

    // Auto-extract color when icon changes
    useEffect(() => {
        let cancelled = false;
        if (!iconStr || isDefaultItemIconValue(iconStr)) return;

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
            } catch {
                return;
            }
        };
        void extract();
        return () => { cancelled = true; };
    }, [iconStr]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || (!url && showUrlField)) return;

        let iconDataUrl = defaultValues?.iconDataUrl;
        const isIconChanged = iconStr !== defaultValues?.icon;

        if (isDefaultItemIconValue(iconStr)) {
            iconDataUrl = undefined;
        } else if (iconStr) {
            if (isIconChanged || !iconDataUrl) {
                try {
                    const dataUrl = await loadImageAsDataUrl(iconStr).catch(() => null);

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
    const effectivePreviewIcon = isDefaultItemIconValue(iconStr)
        ? ""
        : iconStr || resolvedPreviewIcon || defaultValues?.iconDataUrl || faviconUrl;
    const previewIcon = resolvePreviewIconV1(iconStr, effectivePreviewIcon, composedColor, iconSize);

    return (
        <form id="tag-config-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Top Row: Preview + selection */}
            <div className="flex gap-3 items-stretch h-20">
                <LauncherIconVisualV1
                    icon={previewIcon}
                    className={cn("shrink-0", LAUNCHER_ICON_VISUAL_LARGE_CLASS_V1)}
                />

                {/* Right: Icon Selection List */}
                <div className="flex-1 h-20 rounded-xl border border-border/40 p-1.5 overflow-y-auto custom-scrollbar">
                    {validIcons.length > 0 ? (
                        <div className="grid grid-cols-[repeat(auto-fill,minmax(2.5rem,1fr))] gap-2">
                            {validIcons.map((src) => {
                                const active = src === iconStr;
                                const candidateIcon = resolvePreviewIconV1(
                                    src,
                                    isDefaultItemIconValue(src) ? "" : src,
                                    composedColor,
                                    1
                                );

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
                                        <LauncherIconVisualV1
                                            icon={candidateIcon}
                                            className={cn(
                                                "h-8 w-8 rounded-xl",
                                                isDefaultItemIconValue(src) && "text-muted-foreground/60"
                                            )}
                                        />
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
                            onChange={(e) => {
                                const nextUrl = e.target.value;
                                setUrl(nextUrl);
                                if (!title && !defaultValues?.title) {
                                    try {
                                        const nextHostname = new URL(nextUrl.startsWith("http") ? nextUrl : `https://${nextUrl}`)
                                            .hostname
                                            .replace("www.", "");
                                        if (nextHostname) {
                                            setTitle(nextHostname.charAt(0).toUpperCase() + nextHostname.slice(1));
                                        }
                                    } catch {
                                        return;
                                    }
                                }
                            }}
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

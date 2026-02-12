import { isDynamicBackgroundId } from "@/platform/core/dynamicBackgrounds";
import type { DynamicBackgroundConfigMap, DynamicBackgroundId } from "@/platform/core/dynamicBackgrounds";
import type { BackgroundConfig } from "@/platform/state/core/types";

export type TextSurfaceTone = "light" | "dark";
export type TextSurfaceFontPreset = "sans" | "jakarta" | "mono" | "system";

interface TextSurfaceTokens {
    foreground: string;
    strongForeground: string;
    mutedForeground: string;
    cardForeground: string;
    popoverForeground: string;
    secondaryForeground: string;
    accentForeground: string;
}

const TEXT_SURFACE_TOKENS: Record<TextSurfaceTone, TextSurfaceTokens> = {
    dark: {
        foreground: "oklch(0.16 0.02 240)",
        strongForeground: "oklch(0.08 0 0)",
        mutedForeground: "oklch(0.42 0.02 240)",
        cardForeground: "oklch(0.16 0.02 240)",
        popoverForeground: "oklch(0.16 0.02 240)",
        secondaryForeground: "oklch(0.22 0.02 240)",
        accentForeground: "oklch(0.24 0.02 240)",
    },
    light: {
        foreground: "oklch(0.96 0.01 240)",
        strongForeground: "oklch(0.99 0 0)",
        mutedForeground: "oklch(0.8 0.01 240)",
        cardForeground: "oklch(0.96 0.01 240)",
        popoverForeground: "oklch(0.96 0.01 240)",
        secondaryForeground: "oklch(0.93 0.01 240)",
        accentForeground: "oklch(0.94 0.01 240)",
    },
};

const TEXT_SURFACE_FONT_FAMILIES: Record<TextSurfaceFontPreset, string> = {
    sans: "Inter, 'Plus Jakarta Sans', system-ui, sans-serif",
    jakarta: "'Plus Jakarta Sans', Inter, system-ui, sans-serif",
    mono: "'JetBrains Mono Variable', ui-monospace, SFMono-Regular, Menlo, monospace",
    system: "system-ui, -apple-system, 'Segoe UI', sans-serif",
};

const COLOR_LITERAL_PATTERN =
    /(#[0-9a-fA-F]{3,8}|(?:rgba?|hsla?|oklch|oklab|hwb)\([^)]+\))/g;

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

function parseHue(hue: string): number {
    const value = hue.trim().toLowerCase();
    const numeric = Number.parseFloat(value);
    if (Number.isNaN(numeric)) return 0;
    if (value.endsWith("turn")) return numeric * 360;
    if (value.endsWith("rad")) return (numeric * 180) / Math.PI;
    return numeric;
}

function parsePercentage(value: string): number | null {
    const trimmed = value.trim().toLowerCase();
    if (trimmed.endsWith("%")) {
        const numeric = Number.parseFloat(trimmed.slice(0, -1));
        if (Number.isNaN(numeric)) return null;
        return clamp(numeric / 100, 0, 1);
    }

    const numeric = Number.parseFloat(trimmed);
    if (Number.isNaN(numeric)) return null;
    return clamp(numeric <= 1 ? numeric : numeric / 100, 0, 1);
}

function parseRgbChannel(value: string): number | null {
    const trimmed = value.trim().toLowerCase();
    if (trimmed.endsWith("%")) {
        const numeric = Number.parseFloat(trimmed.slice(0, -1));
        if (Number.isNaN(numeric)) return null;
        return clamp((numeric / 100) * 255, 0, 255);
    }

    const numeric = Number.parseFloat(trimmed);
    if (Number.isNaN(numeric)) return null;
    return clamp(numeric, 0, 255);
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
    const normalizedHue = ((h % 360) + 360) % 360;
    const chroma = (1 - Math.abs(2 * l - 1)) * s;
    const secondary = chroma * (1 - Math.abs(((normalizedHue / 60) % 2) - 1));
    const match = l - chroma / 2;

    let r = 0;
    let g = 0;
    let b = 0;

    if (normalizedHue < 60) {
        r = chroma;
        g = secondary;
    } else if (normalizedHue < 120) {
        r = secondary;
        g = chroma;
    } else if (normalizedHue < 180) {
        g = chroma;
        b = secondary;
    } else if (normalizedHue < 240) {
        g = secondary;
        b = chroma;
    } else if (normalizedHue < 300) {
        r = secondary;
        b = chroma;
    } else {
        r = chroma;
        b = secondary;
    }

    return [
        clamp((r + match) * 255, 0, 255),
        clamp((g + match) * 255, 0, 255),
        clamp((b + match) * 255, 0, 255),
    ];
}

function parseHexColor(input: string): [number, number, number] | null {
    const normalized = input.trim().toLowerCase();
    const match = normalized.match(/^#([0-9a-f]{3,8})$/i);
    if (!match) return null;

    let value = match[1];
    if (value.length === 3 || value.length === 4) {
        value = value
            .slice(0, 3)
            .split("")
            .map((ch) => ch + ch)
            .join("");
    } else if (value.length === 6 || value.length === 8) {
        value = value.slice(0, 6);
    } else {
        return null;
    }

    return [
        Number.parseInt(value.slice(0, 2), 16),
        Number.parseInt(value.slice(2, 4), 16),
        Number.parseInt(value.slice(4, 6), 16),
    ];
}

function parseRgbColor(input: string): [number, number, number] | null {
    const match = input.trim().match(/^rgba?\((.+)\)$/i);
    if (!match) return null;

    const content = match[1].split("/")[0].trim();
    const segments = content.includes(",")
        ? content.split(",")
        : content.split(/\s+/);

    if (segments.length < 3) return null;
    const r = parseRgbChannel(segments[0]);
    const g = parseRgbChannel(segments[1]);
    const b = parseRgbChannel(segments[2]);
    if (r == null || g == null || b == null) return null;
    return [r, g, b];
}

function parseHslColor(input: string): [number, number, number] | null {
    const match = input.trim().match(/^hsla?\((.+)\)$/i);
    if (!match) return null;

    const content = match[1].split("/")[0].trim();
    const segments = content.includes(",")
        ? content.split(",")
        : content.split(/\s+/);
    if (segments.length < 3) return null;

    const hue = parseHue(segments[0]);
    const saturation = parsePercentage(segments[1]);
    const lightness = parsePercentage(segments[2]);
    if (saturation == null || lightness == null) return null;

    return hslToRgb(hue, saturation, lightness);
}

function srgbToLinear(value: number): number {
    const normalized = value / 255;
    return normalized <= 0.04045
        ? normalized / 12.92
        : Math.pow((normalized + 0.055) / 1.055, 2.4);
}

function getRelativeLuminance([r, g, b]: [number, number, number]): number {
    const lr = srgbToLinear(r);
    const lg = srgbToLinear(g);
    const lb = srgbToLinear(b);
    return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
}

function getColorContext(): CanvasRenderingContext2D | null {
    if (typeof document === "undefined") return null;
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    return canvas.getContext("2d");
}

function parseCanvasColor(input: string): [number, number, number] | null {
    const ctx = getColorContext();
    if (!ctx) return null;

    // Sentinel color for invalid input detection.
    ctx.fillStyle = "rgb(1, 2, 3)";
    const sentinel = ctx.fillStyle;
    ctx.fillStyle = input.trim();
    if (ctx.fillStyle === sentinel) return null;
    const resolved = ctx.fillStyle;

    if (resolved.startsWith("#")) {
        let value = resolved.slice(1);
        if (value.length === 3) {
            value = value.split("").map((ch) => ch + ch).join("");
        }
        if (value.length !== 6) return null;
        return [
            Number.parseInt(value.slice(0, 2), 16),
            Number.parseInt(value.slice(2, 4), 16),
            Number.parseInt(value.slice(4, 6), 16),
        ];
    }

    const rgbMatch = resolved.match(/^rgba?\((.+)\)$/i);
    if (!rgbMatch) return null;
    const channels = rgbMatch[1].split(",").map((segment) => segment.trim());
    if (channels.length < 3) return null;
    const r = Number.parseFloat(channels[0]);
    const g = Number.parseFloat(channels[1]);
    const b = Number.parseFloat(channels[2]);
    if ([r, g, b].some((channel) => Number.isNaN(channel))) return null;
    return [clamp(r, 0, 255), clamp(g, 0, 255), clamp(b, 0, 255)];
}

function parseColor(input: string): [number, number, number] | null {
    return (
        parseHexColor(input) ??
        parseRgbColor(input) ??
        parseHslColor(input) ??
        parseCanvasColor(input)
    );
}

function extractGradientColors(gradient: string): string[] {
    const matches = gradient.match(COLOR_LITERAL_PATTERN);
    return matches ?? [];
}

function getAverageLuminance(colors: readonly string[]): number | null {
    const luminances = colors
        .map((color) => parseColor(color))
        .filter((value): value is [number, number, number] => value !== null)
        .map(getRelativeLuminance);

    if (luminances.length === 0) return null;
    const sum = luminances.reduce((total, value) => total + value, 0);
    return sum / luminances.length;
}

function resolveThemePalette(
    backgroundId: DynamicBackgroundId,
    config: DynamicBackgroundConfigMap
): readonly string[] {
    switch (backgroundId) {
        case "color-bends":
            return config["color-bends"].colors;
        case "light-pillar":
            return [config["light-pillar"].topColor, config["light-pillar"].bottomColor];
        case "silk":
            return [config.silk.color];
        case "floating-lines":
            return config["floating-lines"].linesGradient;
        case "aurora":
            return config.aurora.colorStops;
        case "particles":
            return config.particles.particleColors;
        case "prismatic-burst":
            return config["prismatic-burst"].colors;
        default:
            return [];
    }
}

function toneFromLuminance(luminance: number): TextSurfaceTone {
    // Brighter backgrounds use darker text; darker backgrounds use lighter text.
    return luminance >= 0.42 ? "dark" : "light";
}

function applyOverlay(luminance: number, overlay: number | undefined): number {
    const overlayRatio = clamp((overlay ?? 0) / 100, 0, 1);
    // Overlay layer in BackgroundLayer is black, so perceived luminance drops with overlay.
    return luminance * (1 - overlayRatio);
}

function getFallbackTone(theme: "light" | "dark" | "system"): TextSurfaceTone {
    if (theme === "dark") return "light";
    if (theme === "light") return "dark";
    if (typeof window === "undefined") return "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "light" : "dark";
}

function getImageLuminance(imageUrl: string): Promise<number | null> {
    if (typeof window === "undefined") return Promise.resolve(null);

    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.decoding = "async";

        img.onload = () => {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d", { willReadFrequently: true });
            if (!ctx) {
                resolve(null);
                return;
            }

            const targetWidth = 24;
            const targetHeight = 24;
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

            try {
                const { data } = ctx.getImageData(0, 0, targetWidth, targetHeight);
                let luminanceSum = 0;
                let weightSum = 0;
                for (let index = 0; index < data.length; index += 4) {
                    const alpha = data[index + 3] / 255;
                    if (alpha <= 0) continue;
                    const luminance = getRelativeLuminance([
                        data[index],
                        data[index + 1],
                        data[index + 2],
                    ]);
                    luminanceSum += luminance * alpha;
                    weightSum += alpha;
                }
                resolve(weightSum > 0 ? luminanceSum / weightSum : null);
            } catch {
                resolve(null);
            }
        };

        img.onerror = () => resolve(null);
        img.src = imageUrl;
    });
}

export function applyGlobalTextSurfaceTone(tone: TextSurfaceTone): void {
    if (typeof document === "undefined") return;

    const root = document.documentElement;
    const tokens = TEXT_SURFACE_TOKENS[tone];

    root.style.setProperty("--text-surface-tone", tone);
    root.style.setProperty("--text-surface-foreground", tokens.foreground);
    root.style.setProperty("--text-surface-strong-foreground", tokens.strongForeground);
    root.style.setProperty("--text-surface-muted-foreground", tokens.mutedForeground);
    root.style.setProperty("--foreground", tokens.foreground);
    root.style.setProperty("--muted-foreground", tokens.mutedForeground);
    root.style.setProperty("--card-foreground", tokens.cardForeground);
    root.style.setProperty("--popover-foreground", tokens.popoverForeground);
    root.style.setProperty("--secondary-foreground", tokens.secondaryForeground);
    root.style.setProperty("--accent-foreground", tokens.accentForeground);
}

export function applyGlobalTextSurfaceFont(fontPreset: TextSurfaceFontPreset): void {
    if (typeof document === "undefined") return;

    const root = document.documentElement;
    root.style.setProperty("--text-surface-font-preset", fontPreset);
    root.style.setProperty("--text-surface-font-family", TEXT_SURFACE_FONT_FAMILIES[fontPreset]);
}

export function resolveTextSurfaceToneSync(options: {
    backgroundConfig: BackgroundConfig;
    dynamicBackgroundConfig: DynamicBackgroundConfigMap;
    theme: "light" | "dark" | "system";
}): TextSurfaceTone {
    const { backgroundConfig, dynamicBackgroundConfig, theme } = options;
    const fallbackTone = getFallbackTone(theme);
    const { type, value, overlay } = backgroundConfig;
    let luminance: number | null = null;

    if (type === "solid") {
        const rgb = parseColor(value);
        luminance = rgb ? getRelativeLuminance(rgb) : null;
    } else if (type === "gradient") {
        luminance = getAverageLuminance(extractGradientColors(value));
    } else if (type === "theme") {
        // Current theme backgrounds are rendered on top of a dark base gradient in BackgroundLayer,
        // so text should default to light for stable contrast.
        if (isDynamicBackgroundId(value)) {
            const palette = resolveThemePalette(value, dynamicBackgroundConfig);
            luminance = getAverageLuminance(palette);
        }
        const resolved = luminance == null
            ? 0.12
            : Math.min(luminance, 0.28);
        return toneFromLuminance(applyOverlay(resolved, overlay));
    }

    if (luminance == null) return fallbackTone;
    return toneFromLuminance(applyOverlay(luminance, overlay));
}

export async function resolveTextSurfaceToneForImage(options: {
    imageUrl: string;
    overlay: number | undefined;
    theme: "light" | "dark" | "system";
}): Promise<TextSurfaceTone> {
    const { imageUrl, overlay, theme } = options;
    const fallbackTone = getFallbackTone(theme);
    const luminance = await getImageLuminance(imageUrl);
    if (luminance == null) return fallbackTone;
    return toneFromLuminance(applyOverlay(luminance, overlay));
}

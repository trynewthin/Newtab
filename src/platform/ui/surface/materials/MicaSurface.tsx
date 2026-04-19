import type React from "react";
import { cn } from "@/shared/utils";
import type { AppSurfaceVariant, MicaMaterialConfig } from "@/core/surfaceMaterials";

interface MicaSurfaceProps {
    variant: AppSurfaceVariant;
    resolvedTone: "light" | "dark";
    config: MicaMaterialConfig;
    className?: string;
    style?: React.CSSProperties;
    width?: string | number;
    height?: string | number;
    borderRadius?: number;
    hideSurfaceBorder?: boolean;
    stabilizeCorners?: boolean;
    createStableCornerBorderStyle?: (color: string) => React.CSSProperties;
    children?: React.ReactNode;
}

const MICA_VARIANT_PRESETS: Record<AppSurfaceVariant, { light: { borderRadius: number }; dark: { borderRadius: number } }> = {
    base: { light: { borderRadius: 18 }, dark: { borderRadius: 18 } },
    toolbar: { light: { borderRadius: 28 }, dark: { borderRadius: 28 } },
    "search-bar": { light: { borderRadius: 50 }, dark: { borderRadius: 50 } },
    widget: { light: { borderRadius: 24 }, dark: { borderRadius: 24 } },
    "folder-preview": { light: { borderRadius: 32 }, dark: { borderRadius: 32 } },
};

const NOISE_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

function hexToRgbChannels(value: string) {
    const normalized = value.replace("#", "");
    const safeHex = normalized.length === 3
        ? normalized.split("").map((char) => char + char).join("")
        : normalized;

    const r = Number.parseInt(safeHex.slice(0, 2), 16);
    const g = Number.parseInt(safeHex.slice(2, 4), 16);
    const b = Number.parseInt(safeHex.slice(4, 6), 16);

    if ([r, g, b].some((channel) => Number.isNaN(channel))) {
        return "184 196 218";
    }

    return `${r} ${g} ${b}`;
}

export function MicaSurface({
    variant,
    resolvedTone,
    config,
    className,
    style,
    width,
    height,
    borderRadius,
    hideSurfaceBorder = false,
    stabilizeCorners = false,
    createStableCornerBorderStyle,
    children,
}: MicaSurfaceProps) {
    const preset = MICA_VARIANT_PRESETS[variant][resolvedTone];
    const resolvedBorderRadius = borderRadius ?? preset.borderRadius;
    const resolvedWidth = width ?? "100%";
    const resolvedHeight = height ?? "100%";
    const isDark = resolvedTone === "dark";

    const backgroundColor = isDark
        ? `rgb(30 32 36 / ${config.backgroundOpacity})`
        : `rgb(244 246 250 / ${config.backgroundOpacity})`;
    const borderColor = isDark
        ? `rgb(255 255 255 / ${config.borderOpacity})`
        : `rgb(255 255 255 / ${Math.min(config.borderOpacity + 0.08, 0.4)})`;
    const tintChannels = hexToRgbChannels(config.tintColor);
    const tintColor = `rgb(${tintChannels} / ${config.tintOpacity})`;
    const shadowOpacity = config.shadowOpacity;
    const boxShadow = isDark
        ? `0 8px 20px rgb(0 0 0 / ${shadowOpacity * 0.5}), 0 24px 56px rgb(0 0 0 / ${shadowOpacity * 0.35})`
        : `0 6px 16px rgb(0 0 0 / ${shadowOpacity * 0.14}), 0 18px 42px rgb(0 0 0 / ${shadowOpacity * 0.08})`;
    const backdropValue = isDark
        ? `blur(${config.blur}px) saturate(${config.saturation}) brightness(0.96)`
        : `blur(${config.blur}px) saturate(${config.saturation}) brightness(1.02)`;

    return (
        <div
            className={cn("relative overflow-hidden", className)}
            style={{
                width: resolvedWidth,
                height: resolvedHeight,
                borderRadius: resolvedBorderRadius,
                boxSizing: "border-box",
                backdropFilter: backdropValue,
                WebkitBackdropFilter: backdropValue,
                backgroundColor,
                ...(hideSurfaceBorder
                    ? {}
                    : (stabilizeCorners && createStableCornerBorderStyle
                        ? createStableCornerBorderStyle(borderColor)
                        : { border: `${config.borderWidth}px solid ${borderColor}` })),
                boxShadow,
                ...style,
            }}
        >
            <div
                className="absolute inset-0 pointer-events-none rounded-[inherit]"
                style={{
                    backgroundColor: tintColor,
                }}
            />
            <div
                className="absolute inset-0 pointer-events-none rounded-[inherit]"
                style={{
                    backgroundImage: NOISE_SVG,
                    backgroundRepeat: "repeat",
                    backgroundSize: "112px 112px",
                    opacity: config.noiseOpacity,
                    mixBlendMode: isDark ? "soft-light" : "overlay",
                }}
            />
            <div className="relative z-10 h-full w-full">
                {children}
            </div>
        </div>
    );
}

import type React from "react";
import { cn } from "@/platform/core/utils";
import type { AppSurfaceVariant, MacFrostedMaterialConfig } from "@/platform/core/surfaceMaterials";
import { FROSTED_VARIANT_PRESETS } from "./surfacePresets";

interface MacFrostedSurfaceProps {
    variant: AppSurfaceVariant;
    resolvedTone: "light" | "dark";
    config: MacFrostedMaterialConfig;
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

const NOISE_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

export function MacFrostedSurface({
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
}: MacFrostedSurfaceProps) {
    const preset = FROSTED_VARIANT_PRESETS[variant][resolvedTone];
    const merged = { ...preset, ...config };
    const resolvedBorderRadius = borderRadius ?? preset.borderRadius;
    const resolvedWidth = width ?? "100%";
    const resolvedHeight = height ?? "100%";
    const isDark = resolvedTone === "dark";

    const backgroundColor = isDark
        ? `rgb(28 28 30 / ${merged.backgroundOpacity})`
        : `rgb(255 255 255 / ${merged.backgroundOpacity})`;

    const borderColor = isDark
        ? `rgb(255 255 255 / ${merged.borderOpacity})`
        : `rgb(255 255 255 / ${Math.min(merged.borderOpacity + 0.08, 0.5)})`;

    const topHighlight = isDark
        ? `rgb(255 255 255 / ${merged.highlightOpacity})`
        : `rgb(255 255 255 / ${Math.min(merged.highlightOpacity + 0.04, 0.3)})`;

    const innerGlow = isDark
        ? `rgb(255 255 255 / ${merged.highlightOpacity * 0.3})`
        : `rgb(255 255 255 / ${Math.min(merged.highlightOpacity * 0.4, 0.15)})`;

    const s = merged.shadowOpacity;
    const boxShadowLayers = isDark
        ? `0 0.5px 0 0 ${topHighlight} inset, 0 1px 3px rgb(0 0 0 / ${s * 0.6}), 0 6px 16px rgb(0 0 0 / ${s * 0.4}), 0 20px 48px rgb(0 0 0 / ${s * 0.3})`
        : `0 0.5px 0 0 ${topHighlight} inset, 0 1px 2px rgb(0 0 0 / ${s * 0.25}), 0 4px 12px rgb(0 0 0 / ${s * 0.12}), 0 16px 40px rgb(0 0 0 / ${s * 0.06})`;

    const backdropValue = isDark
        ? `blur(${merged.blur}px) saturate(${merged.saturation}) brightness(1.1)`
        : `blur(${merged.blur}px) saturate(${merged.saturation}) brightness(1.05)`;

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
                        : { border: `0.5px solid ${borderColor}` })),
                boxShadow: boxShadowLayers,
                ...style,
            }}
        >
            {/* Subtle top-edge highlight — mimics macOS inner glow */}
            <div
                className="absolute inset-x-0 top-0 pointer-events-none rounded-[inherit]"
                style={{
                    height: "50%",
                    background: `linear-gradient(180deg, ${topHighlight} 0%, transparent 100%)`,
                    opacity: isDark ? 0.5 : 0.7,
                }}
            />
            {/* Soft center glow */}
            <div
                className="absolute inset-0 pointer-events-none rounded-[inherit]"
                style={{
                    background: `radial-gradient(80% 50% at 50% 0%, ${innerGlow} 0%, transparent 100%)`,
                }}
            />
            {/* Noise texture — adds grain like macOS vibrancy */}
            <div
                className="absolute inset-0 pointer-events-none rounded-[inherit]"
                style={{
                    backgroundImage: NOISE_SVG,
                    backgroundRepeat: "repeat",
                    backgroundSize: "128px 128px",
                    opacity: isDark ? 0.03 : 0.025,
                    mixBlendMode: "overlay",
                }}
            />
            <div className="relative z-10 h-full w-full">
                {children}
            </div>
        </div>
    );
}

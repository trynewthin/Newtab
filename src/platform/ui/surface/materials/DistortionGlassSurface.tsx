import type React from "react";
import { cn } from "@/core/utils";
import type { AppSurfaceVariant, DistortionGlassMaterialConfig } from "@/core/surfaceMaterials";
import GlassSurface, { type GlassSurfaceProps } from "@/components/GlassSurface";
import { DISTORTION_VARIANT_PRESETS } from "./presets";

interface DistortionGlassSurfaceProps {
    variant: AppSurfaceVariant;
    resolvedTone: "light" | "dark";
    config: DistortionGlassMaterialConfig;
    className?: string;
    style?: React.CSSProperties;
    width?: string | number;
    height?: string | number;
    borderRadius?: number;
    hideSurfaceBorder?: boolean;
    stabilizeCorners?: boolean;
    children?: React.ReactNode;
    restProps?: Partial<GlassSurfaceProps>;
}

export function DistortionGlassSurface({
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
    children,
    restProps = {},
}: DistortionGlassSurfaceProps) {
    const distortionPreset = DISTORTION_VARIANT_PRESETS[variant][resolvedTone];
    const resolvedBorderRadius = borderRadius ?? distortionPreset.borderRadius ?? 20;
    const resolvedWidth = width ?? distortionPreset.width ?? "100%";
    const resolvedHeight = height ?? distortionPreset.height ?? "100%";
    const distortionRingColor = resolvedTone === "dark"
        ? "rgb(255 255 255 / 0.24)"
        : "rgb(255 255 255 / 0.46)";

    const stableCornerBorderWidth = 1;
    const createStableCornerBorderStyle = (color: string): React.CSSProperties => ({
        border: `${stableCornerBorderWidth}px solid ${color}`,
        boxSizing: "border-box",
    });

    if (!stabilizeCorners) {
        return (
            <GlassSurface
                {...distortionPreset}
                {...config}
                width={resolvedWidth}
                height={resolvedHeight}
                borderRadius={resolvedBorderRadius}
                {...restProps}
                className={cn(className)}
                style={style}
            >
                {children}
            </GlassSurface>
        );
    }

    return (
        <div
            className={cn("relative overflow-hidden", className)}
            style={{
                width: resolvedWidth,
                height: resolvedHeight,
                borderRadius: resolvedBorderRadius,
                boxSizing: "border-box",
                ...style,
            }}
        >
            <GlassSurface
                {...distortionPreset}
                {...config}
                width="100%"
                height="100%"
                borderRadius={resolvedBorderRadius}
                {...restProps}
                className="h-full w-full rounded-[inherit]"
            >
                {children}
            </GlassSurface>
            {!hideSurfaceBorder ? (
                <div
                    aria-hidden
                    className="pointer-events-none absolute rounded-[inherit]"
                    style={{
                        ...createStableCornerBorderStyle(distortionRingColor),
                        inset: `${stableCornerBorderWidth}px`,
                    }}
                />
            ) : null}
        </div>
    );
}

import type React from "react";
import { Suspense, lazy } from "react";
import { cn } from "@/platform/core/utils";
import type { AppSurfaceVariant, FluidGlassMaterialConfig } from "@/platform/core/surfaceMaterials";
import { FLUID_VARIANT_PRESETS } from "./surfacePresets";

const FluidGlass = lazy(() => import("@/components/FluidGlass"));

interface FluidGlassSurfaceProps {
    variant: AppSurfaceVariant;
    resolvedTone: "light" | "dark";
    config: FluidGlassMaterialConfig;
    className?: string;
    style?: React.CSSProperties;
    width?: string | number;
    height?: string | number;
    borderRadius?: number;
    children?: React.ReactNode;
}

export function FluidGlassSurface({
    variant,
    resolvedTone,
    config,
    className,
    style,
    width,
    height,
    borderRadius,
    children,
}: FluidGlassSurfaceProps) {
    const preset = FLUID_VARIANT_PRESETS[variant];
    const resolvedBorderRadius = borderRadius ?? preset.borderRadius;
    const resolvedWidth = width ?? "100%";
    const resolvedHeight = height ?? "100%";
    const tintColor = resolvedTone === "dark"
        ? `rgb(0 0 0 / ${config.tintOpacity})`
        : `rgb(255 255 255 / ${config.tintOpacity})`;

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
            <div className="pointer-events-none absolute inset-0">
                <Suspense fallback={null}>
                    <FluidGlass
                        mode="surface"
                        surfaceProps={{
                            ior: config.ior,
                            thickness: config.thickness,
                            anisotropy: config.anisotropy,
                            chromaticAberration: config.chromaticAberration,
                            distortion: config.distortion,
                            temporalDistortion: config.temporalDistortion,
                        }}
                    />
                </Suspense>
            </div>
            <div
                className="pointer-events-none absolute inset-0 rounded-[inherit]"
                style={{
                    background: tintColor,
                    backdropFilter: `blur(${config.blur}px) saturate(${config.saturation})`,
                    WebkitBackdropFilter: `blur(${config.blur}px) saturate(${config.saturation})`,
                }}
            />
            <div className="relative z-10 h-full w-full">
                {children}
            </div>
        </div>
    );
}

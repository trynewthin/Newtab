import type React from "react";
import { useSettingsStore } from "@/apps/settings/store";
import type { GlassSurfaceProps } from "@/components/GlassSurface";
import {
    type AppSurfaceMaterial,
    type AppSurfaceTone,
    type AppSurfaceVariant,
    mergeSurfaceMaterialConfig,
} from "@/core/surfaceMaterials";
import { useResolvedTone } from "./useResolvedTone";
import { MacFrostedSurface } from "./materials/MacFrostedSurface";
import { FluidGlassSurface } from "./materials/FluidGlassSurface";
import { DistortionGlassSurface } from "./materials/DistortionGlassSurface";

export interface AppSurfaceProps extends GlassSurfaceProps {
    material?: AppSurfaceMaterial;
    variant?: AppSurfaceVariant;
    tone?: AppSurfaceTone;
}

export function AppSurface({
    material: overrideMaterial,
    variant = "base",
    tone,
    className,
    style,
    children,
    width,
    height,
    borderRadius,
    ...restProps
}: AppSurfaceProps) {
    const activeMaterial = useSettingsStore((state) => state.surfaceMaterial);
    const materialConfig = mergeSurfaceMaterialConfig(
        useSettingsStore((state) => state.surfaceMaterialConfig)
    );
    const resolvedMaterial = overrideMaterial ?? activeMaterial;
    const resolvedTone = useResolvedTone(tone);
    const stabilizeCorners = variant === "widget" || variant === "folder-preview";
    const hideSurfaceBorder = variant === "widget";
    const stableCornerBorderWidth = 1;
    const createStableCornerBorderStyle = (color: string): React.CSSProperties => ({
        border: `${stableCornerBorderWidth}px solid ${color}`,
        boxSizing: "border-box",
    });

    if (resolvedMaterial === "fluid-glass") {
        return (
            <FluidGlassSurface
                variant={variant}
                resolvedTone={resolvedTone}
                config={materialConfig["fluid-glass"]}
                className={className}
                style={style}
                width={width}
                height={height}
                borderRadius={borderRadius}
            >
                {children}
            </FluidGlassSurface>
        );
    }

    if (resolvedMaterial === "mac-frosted") {
        return (
            <MacFrostedSurface
                variant={variant}
                resolvedTone={resolvedTone}
                config={materialConfig["mac-frosted"]}
                className={className}
                style={style}
                width={width}
                height={height}
                borderRadius={borderRadius}
                hideSurfaceBorder={hideSurfaceBorder}
                stabilizeCorners={stabilizeCorners}
                createStableCornerBorderStyle={createStableCornerBorderStyle}
            >
                {children}
            </MacFrostedSurface>
        );
    }

    return (
        <DistortionGlassSurface
            variant={variant}
            resolvedTone={resolvedTone}
            config={materialConfig["glass-distortion"]}
            className={className}
            style={style}
            width={width}
            height={height}
            borderRadius={borderRadius}
            hideSurfaceBorder={hideSurfaceBorder}
            stabilizeCorners={stabilizeCorners}
            restProps={restProps}
        >
            {children}
        </DistortionGlassSurface>
    );
}

export default AppSurface;

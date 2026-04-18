import type React from "react";
import { useAppearancePreferenceStore } from "@/config";
import {
    type AppSurfaceTone,
    type AppSurfaceVariant,
    mergeSurfaceMaterialConfig,
} from "@/core/surfaceMaterials";
import { useResolvedTone } from "./useResolvedTone";
import { MacFrostedSurface } from "./materials/MacFrostedSurface";

export interface AppSurfaceProps {
    variant?: AppSurfaceVariant;
    tone?: AppSurfaceTone;
    hideSurfaceBorder?: boolean;
    className?: string;
    style?: React.CSSProperties;
    children?: React.ReactNode;
    width?: string | number;
    height?: string | number;
    borderRadius?: number;
}

export function AppSurface({
    variant = "base",
    tone,
    hideSurfaceBorder: hideSurfaceBorderOverride,
    className,
    style,
    children,
    width,
    height,
    borderRadius,
}: AppSurfaceProps) {
    const materialConfig = mergeSurfaceMaterialConfig(
        useAppearancePreferenceStore((state) => state.surfaceMaterialConfig)
    );
    const resolvedTone = useResolvedTone(tone);
    const stabilizeCorners = variant === "widget" || variant === "folder-preview";
    const hideSurfaceBorder = hideSurfaceBorderOverride ?? (variant === "widget");
    const stableCornerBorderWidth = 1;
    const createStableCornerBorderStyle = (color: string): React.CSSProperties => ({
        border: `${stableCornerBorderWidth}px solid ${color}`,
        boxSizing: "border-box",
    });

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

export default AppSurface;

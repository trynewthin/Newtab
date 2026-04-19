import type React from "react";
import { useAppearancePreferenceStore } from "@/config";
import {
    type AppSurfaceTone,
    type AppSurfaceVariant,
    mergeSurfaceMaterialConfig,
} from "@/core/surfaceMaterials";
import { useResolvedTone } from "./useResolvedTone";
import { MacFrostedSurface } from "./materials/MacFrostedSurface";
import { MicaSurface } from "./materials/MicaSurface";

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
    const surfaceMaterial = useAppearancePreferenceStore((state) => state.surfaceMaterial);
    const resolvedTone = useResolvedTone(tone);
    const stabilizeCorners = variant === "widget" || variant === "folder-preview";
    const hideSurfaceBorder = hideSurfaceBorderOverride ?? (variant === "widget");
    const borderWidth = materialConfig[surfaceMaterial].borderWidth;
    const createStableCornerBorderStyle = (color: string): React.CSSProperties => ({
        border: `${borderWidth}px solid ${color}`,
        boxSizing: "border-box",
    });

    const commonProps = {
        variant,
        resolvedTone,
        className,
        style,
        width,
        height,
        borderRadius,
        hideSurfaceBorder,
        stabilizeCorners,
        createStableCornerBorderStyle,
        children,
    };

    if (surfaceMaterial === "mica") {
        return (
            <MicaSurface
                {...commonProps}
                config={materialConfig.mica}
            />
        );
    }

    return (
        <MacFrostedSurface
            {...commonProps}
            config={materialConfig["mac-frosted"]}
        />
    );
}

export default AppSurface;

import { Suspense, lazy, useEffect, useState } from "react";
import { useSettingsStore } from "@/apps/settings/store";
import { cn } from "@/platform/core/utils";
import {
    type AppSurfaceMaterial,
    type AppSurfaceTone,
    type AppSurfaceVariant,
    mergeSurfaceMaterialConfig,
} from "@/platform/core/surfaceMaterials";
import GlassSurface, { type GlassSurfaceProps } from "@/components/GlassSurface";

const FluidGlass = lazy(() => import("@/components/FluidGlass"));

type SurfacePresetMap = Record<AppSurfaceVariant, { light: Partial<GlassSurfaceProps>; dark: Partial<GlassSurfaceProps> }>;
type FrostedPreset = {
    backgroundOpacity: number;
    saturation: number;
    blur: number;
    borderOpacity: number;
    highlightOpacity: number;
    shadowOpacity: number;
    borderRadius: number;
};
type FrostedPresetMap = Record<AppSurfaceVariant, { light: FrostedPreset; dark: FrostedPreset }>;

const DISTORTION_VARIANT_PRESETS: SurfacePresetMap = {
    base: {
        light: { backgroundOpacity: 0.18, saturation: 1.18, brightness: 54, opacity: 0.93, blur: 11 },
        dark: { backgroundOpacity: 0.24, saturation: 1.24, brightness: 58, opacity: 0.95, blur: 12 },
    },
    toolbar: {
        light: { borderRadius: 28, blur: 10 },
        dark: { borderRadius: 28, blur: 11 },
    },
    "search-bar": {
        light: { width: "100%", height: "100%", borderRadius: 50, displace: 3.0 },
        dark: { width: "100%", height: "100%", borderRadius: 50, displace: 3.0 },
    },
    widget: {
        light: { width: "100%", height: "100%", borderRadius: 16, borderWidth: 0 },
        dark: { width: "100%", height: "100%", borderRadius: 16, borderWidth: 0 },
    },
    "folder-preview": {
        light: { width: "100%", height: "100%", borderRadius: 32 },
        dark: { width: "100%", height: "100%", borderRadius: 32 },
    },
};

const FROSTED_VARIANT_PRESETS: FrostedPresetMap = {
    base: {
        light: { backgroundOpacity: 0.5, saturation: 1.15, blur: 18, borderOpacity: 0.32, highlightOpacity: 0.2, shadowOpacity: 0.16, borderRadius: 18 },
        dark: { backgroundOpacity: 0.26, saturation: 1.22, blur: 16, borderOpacity: 0.24, highlightOpacity: 0.17, shadowOpacity: 0.2, borderRadius: 18 },
    },
    toolbar: {
        light: { backgroundOpacity: 0.48, saturation: 1.12, blur: 17, borderOpacity: 0.32, highlightOpacity: 0.2, shadowOpacity: 0.15, borderRadius: 28 },
        dark: { backgroundOpacity: 0.24, saturation: 1.2, blur: 15, borderOpacity: 0.22, highlightOpacity: 0.16, shadowOpacity: 0.2, borderRadius: 28 },
    },
    "search-bar": {
        light: { backgroundOpacity: 0.5, saturation: 1.12, blur: 19, borderOpacity: 0.34, highlightOpacity: 0.22, shadowOpacity: 0.15, borderRadius: 50 },
        dark: { backgroundOpacity: 0.26, saturation: 1.22, blur: 16, borderOpacity: 0.24, highlightOpacity: 0.17, shadowOpacity: 0.2, borderRadius: 50 },
    },
    widget: {
        light: { backgroundOpacity: 0.5, saturation: 1.16, blur: 17, borderOpacity: 0, highlightOpacity: 0.2, shadowOpacity: 0.15, borderRadius: 16 },
        dark: { backgroundOpacity: 0.25, saturation: 1.24, blur: 15, borderOpacity: 0, highlightOpacity: 0.16, shadowOpacity: 0.2, borderRadius: 16 },
    },
    "folder-preview": {
        light: { backgroundOpacity: 0.5, saturation: 1.15, blur: 18, borderOpacity: 0.32, highlightOpacity: 0.21, shadowOpacity: 0.16, borderRadius: 32 },
        dark: { backgroundOpacity: 0.26, saturation: 1.22, blur: 16, borderOpacity: 0.24, highlightOpacity: 0.17, shadowOpacity: 0.2, borderRadius: 32 },
    },
};

const FLUID_VARIANT_PRESETS: Record<AppSurfaceVariant, { borderRadius: number }> = {
    base: { borderRadius: 18 },
    toolbar: { borderRadius: 28 },
    "search-bar": { borderRadius: 50 },
    widget: { borderRadius: 16 },
    "folder-preview": { borderRadius: 32 },
};

function useResolvedTone(explicitTone: AppSurfaceTone | undefined): "light" | "dark" {
    const theme = useSettingsStore((state) => state.theme);
    const globalSurfaceTone = useSettingsStore((state) => state.surfaceTone);
    const [systemDark, setSystemDark] = useState(false);
    const tone = explicitTone ?? globalSurfaceTone;

    useEffect(() => {
        if (typeof window === "undefined") return;
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        setSystemDark(mediaQuery.matches);
        const handler = (event: MediaQueryListEvent) => setSystemDark(event.matches);
        mediaQuery.addEventListener("change", handler);
        return () => mediaQuery.removeEventListener("change", handler);
    }, []);

    if (tone === "light") return "light";
    if (tone === "dark") return "dark";
    if (theme === "dark") return "dark";
    if (theme === "light") return "light";
    return systemDark ? "dark" : "light";
}

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
        const config = materialConfig["fluid-glass"];
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

    if (resolvedMaterial === "mac-frosted") {
        const preset = FROSTED_VARIANT_PRESETS[variant][resolvedTone];
        const config = materialConfig["mac-frosted"];
        const merged = { ...preset, ...config };
        const resolvedBorderRadius = borderRadius ?? preset.borderRadius;
        const resolvedWidth = width ?? "100%";
        const resolvedHeight = height ?? "100%";

        const backgroundColor = resolvedTone === "dark"
            ? `rgb(15 23 42 / ${merged.backgroundOpacity})`
            : `rgb(255 255 255 / ${merged.backgroundOpacity})`;

        const borderColor = resolvedTone === "dark"
            ? `rgb(255 255 255 / ${merged.borderOpacity})`
            : `rgb(255 255 255 / ${Math.min(merged.borderOpacity + 0.1, 0.58)})`;

        const shadowColor = resolvedTone === "dark"
            ? `rgb(0 0 0 / ${merged.shadowOpacity})`
            : `rgb(15 23 42 / ${merged.shadowOpacity * 0.72})`;

        const topHighlight = resolvedTone === "dark"
            ? `rgb(255 255 255 / ${merged.highlightOpacity})`
            : `rgb(255 255 255 / ${Math.min(merged.highlightOpacity + 0.12, 0.78)})`;

        const centerHighlight = resolvedTone === "dark"
            ? `rgb(255 255 255 / ${merged.highlightOpacity * 0.55})`
            : `rgb(255 255 255 / ${Math.min(merged.highlightOpacity + 0.06, 0.64)})`;

        return (
            <div
                className={cn("relative overflow-hidden", className)}
                style={{
                    width: resolvedWidth,
                    height: resolvedHeight,
                    borderRadius: resolvedBorderRadius,
                    boxSizing: "border-box",
                    backdropFilter: `blur(${merged.blur}px) saturate(${merged.saturation})`,
                    WebkitBackdropFilter: `blur(${merged.blur}px) saturate(${merged.saturation})`,
                    backgroundColor,
                    ...(hideSurfaceBorder
                        ? {}
                        : (stabilizeCorners
                            ? createStableCornerBorderStyle(borderColor)
                            : { border: `1px solid ${borderColor}` })),
                    boxShadow: `0 12px 30px ${shadowColor}, inset 0 1px 0 ${topHighlight}`,
                    ...style,
                }}
            >
                <div
                    className="absolute inset-0 pointer-events-none rounded-[inherit]"
                    style={{
                        background: `linear-gradient(180deg, ${topHighlight} 0%, rgb(255 255 255 / 0) 48%)`,
                    }}
                />
                <div
                    className="absolute inset-0 pointer-events-none rounded-[inherit]"
                    style={{
                        background: `radial-gradient(120% 82% at 50% 0%, ${centerHighlight} 0%, rgb(255 255 255 / 0) 72%)`,
                    }}
                />
                <div className="relative z-10 h-full w-full">
                    {children}
                </div>
            </div>
        );
    }

    const distortionPreset = DISTORTION_VARIANT_PRESETS[variant][resolvedTone];
    const distortionConfig = materialConfig["glass-distortion"];
    const resolvedBorderRadius = borderRadius ?? distortionPreset.borderRadius ?? 20;
    const resolvedWidth = width ?? distortionPreset.width ?? "100%";
    const resolvedHeight = height ?? distortionPreset.height ?? "100%";
    const distortionRingColor = resolvedTone === "dark"
        ? "rgb(255 255 255 / 0.24)"
        : "rgb(255 255 255 / 0.46)";

    if (!stabilizeCorners) {
        return (
            <GlassSurface
                {...distortionPreset}
                {...distortionConfig}
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
                {...distortionConfig}
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

export default AppSurface;

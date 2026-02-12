import { useEffect, useRef, useState } from "react";
import { useSettingsStore } from "@/apps/settings/store";
import { cn } from "@/platform/core/utils";
import {
    type AppSurfaceMaterial,
    type AppSurfaceTone,
    type AppSurfaceVariant,
    type RaysOrigin,
    mergeSurfaceMaterialConfig,
} from "@/platform/core/surfaceMaterials";
import GlassSurface, { type GlassSurfaceProps } from "@/components/GlassSurface";

type SurfacePresetMap = Record<AppSurfaceVariant, { light: Partial<GlassSurfaceProps>; dark: Partial<GlassSurfaceProps> }>;

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
        light: { width: "100%", height: "100%", borderRadius: 16 },
        dark: { width: "100%", height: "100%", borderRadius: 16 },
    },
    "folder-preview": {
        light: { width: "100%", height: "100%", borderRadius: 32 },
        dark: { width: "100%", height: "100%", borderRadius: 32 },
    },
};

const RAYS_VARIANT_PRESETS: SurfacePresetMap = {
    base: {
        light: { backgroundOpacity: 0.16, saturation: 1.1, brightness: 52, opacity: 0.94, blur: 10, displace: 0.2 },
        dark: { backgroundOpacity: 0.22, saturation: 1.18, brightness: 58, opacity: 0.96, blur: 11, displace: 0.2 },
    },
    toolbar: {
        light: { borderRadius: 28, backgroundOpacity: 0.16, saturation: 1.08, brightness: 52, opacity: 0.94, blur: 10, displace: 0.2 },
        dark: { borderRadius: 28, backgroundOpacity: 0.22, saturation: 1.16, brightness: 58, opacity: 0.96, blur: 11, displace: 0.2 },
    },
    "search-bar": {
        light: { width: "100%", height: "100%", borderRadius: 50, backgroundOpacity: 0.16, saturation: 1.08, brightness: 52, opacity: 0.94, blur: 10, displace: 0.2 },
        dark: { width: "100%", height: "100%", borderRadius: 50, backgroundOpacity: 0.22, saturation: 1.16, brightness: 58, opacity: 0.96, blur: 11, displace: 0.2 },
    },
    widget: {
        light: { width: "100%", height: "100%", borderRadius: 16, backgroundOpacity: 0.16, saturation: 1.1, brightness: 52, opacity: 0.94, blur: 10, displace: 0.2 },
        dark: { width: "100%", height: "100%", borderRadius: 16, backgroundOpacity: 0.22, saturation: 1.18, brightness: 58, opacity: 0.96, blur: 11, displace: 0.2 },
    },
    "folder-preview": {
        light: { width: "100%", height: "100%", borderRadius: 32, backgroundOpacity: 0.16, saturation: 1.1, brightness: 52, opacity: 0.94, blur: 10, displace: 0.2 },
        dark: { width: "100%", height: "100%", borderRadius: 32, backgroundOpacity: 0.22, saturation: 1.18, brightness: 58, opacity: 0.96, blur: 11, displace: 0.2 },
    },
};

const RAY_ORIGIN_MAP: Record<RaysOrigin, { x: number; y: number; angle: number }> = {
    "top-center": { x: 50, y: 0, angle: 180 },
    "top-left": { x: 0, y: 0, angle: 135 },
    "top-right": { x: 100, y: 0, angle: 225 },
    right: { x: 100, y: 50, angle: 270 },
    left: { x: 0, y: 50, angle: 90 },
    "bottom-center": { x: 50, y: 100, angle: 0 },
    "bottom-right": { x: 100, y: 100, angle: 315 },
    "bottom-left": { x: 0, y: 100, angle: 45 },
};

const NOISE_SVG_DATA_URL =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.2' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='0.9'/%3E%3C/svg%3E";

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

function hexToRgba(hex: string, alpha: number): string {
    const normalized = hex.trim().replace("#", "");
    const full = normalized.length === 3
        ? normalized.split("").map((ch) => ch + ch).join("")
        : normalized;

    if (full.length !== 6) {
        return `rgba(255,255,255,${alpha})`;
    }
    const r = parseInt(full.slice(0, 2), 16);
    const g = parseInt(full.slice(2, 4), 16);
    const b = parseInt(full.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

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

function RaysOverlay({
    raysOrigin,
    raysColor,
    raysSpeed,
    lightSpread,
    rayLength,
    pulsating,
    fadeDistance,
    saturation,
    followMouse,
    mouseInfluence,
    noiseAmount,
    distortion,
    className,
}: {
    raysOrigin: RaysOrigin;
    raysColor: string;
    raysSpeed: number;
    lightSpread: number;
    rayLength: number;
    pulsating: boolean;
    fadeDistance: number;
    saturation: number;
    followMouse: boolean;
    mouseInfluence: number;
    noiseAmount: number;
    distortion: number;
    className: string;
}) {
    const overlayRef = useRef<HTMLDivElement>(null);
    const mouseAngleRef = useRef(0);
    const [tick, setTick] = useState(0);
    const originMeta = RAY_ORIGIN_MAP[raysOrigin];

    useEffect(() => {
        let raf = 0;
        const start = performance.now();
        const loop = (now: number) => {
            setTick((now - start) / 1000);
            raf = window.requestAnimationFrame(loop);
        };
        raf = window.requestAnimationFrame(loop);
        return () => window.cancelAnimationFrame(raf);
    }, []);

    useEffect(() => {
        if (!followMouse) return;
        const handleMouseMove = (event: MouseEvent) => {
            const rect = overlayRef.current?.getBoundingClientRect();
            if (!rect) return;
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            mouseAngleRef.current = (Math.atan2(event.clientY - cy, event.clientX - cx) * 180) / Math.PI;
        };
        window.addEventListener("mousemove", handleMouseMove, { passive: true });
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, [followMouse]);

    const pulse = pulsating ? 0.82 + Math.sin(tick * raysSpeed * 2.4) * 0.18 : 1;
    const baseRotation = originMeta.angle + tick * raysSpeed * 22;
    const mouseRotation = followMouse ? mouseAngleRef.current * clamp(mouseInfluence, 0, 1) : 0;
    const rotation = baseRotation + mouseRotation;

    const spreadDeg = 6 + clamp(lightSpread, 0.05, 1.5) * 26;
    const activeRayDeg = spreadDeg * 0.34;
    const fadeStop = 20 + clamp(fadeDistance, 0.05, 2) * 60;
    const rayOpacity = clamp(0.1 + clamp(saturation, 0, 1.5) * 0.32, 0.08, 0.82) * pulse;
    const rayColorWithAlpha = hexToRgba(raysColor, rayOpacity);
    const rayScale = 1 + (clamp(rayLength, 0.2, 2) - 1) * 0.5;
    const distortionValue = clamp(distortion, 0, 1) * 6;

    return (
        <>
            <div
                ref={overlayRef}
                className={cn("absolute inset-0 pointer-events-none", className)}
                style={{
                    backgroundImage: `repeating-conic-gradient(from ${rotation}deg at ${originMeta.x}% ${originMeta.y}%, rgba(0,0,0,0) 0deg, ${rayColorWithAlpha} ${activeRayDeg}deg, rgba(0,0,0,0) ${spreadDeg}deg)`,
                    mixBlendMode: "screen",
                    transform: `scale(${rayScale})`,
                    transformOrigin: `${originMeta.x}% ${originMeta.y}%`,
                    filter: `blur(${distortionValue}px) saturate(${clamp(saturation, 0, 1.5)})`,
                    WebkitMaskImage: `radial-gradient(circle at ${originMeta.x}% ${originMeta.y}%, rgba(0,0,0,0.96) 0%, rgba(0,0,0,0) ${fadeStop}%)`,
                    maskImage: `radial-gradient(circle at ${originMeta.x}% ${originMeta.y}%, rgba(0,0,0,0.96) 0%, rgba(0,0,0,0) ${fadeStop}%)`,
                }}
            />
            {noiseAmount > 0 ? (
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        backgroundImage: `url("${NOISE_SVG_DATA_URL}")`,
                        opacity: clamp(noiseAmount, 0, 1) * 0.14,
                        mixBlendMode: "soft-light",
                    }}
                />
            ) : null}
        </>
    );
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
    ...restProps
}: AppSurfaceProps) {
    const activeMaterial = useSettingsStore((state) => state.surfaceMaterial);
    const materialConfig = mergeSurfaceMaterialConfig(
        useSettingsStore((state) => state.surfaceMaterialConfig)
    );
    const resolvedMaterial = overrideMaterial ?? activeMaterial;
    const resolvedTone = useResolvedTone(tone);

    if (resolvedMaterial === "glass-rays") {
        const preset = RAYS_VARIANT_PRESETS[variant][resolvedTone];
        const raysConfig = materialConfig["glass-rays"];

        return (
            <GlassSurface
                {...preset}
                {...restProps}
                className={cn("relative", className)}
                style={style}
            >
                <RaysOverlay {...raysConfig} />
                <div className="relative z-10 h-full w-full">
                    {children}
                </div>
            </GlassSurface>
        );
    }

    const distortionPreset = DISTORTION_VARIANT_PRESETS[variant][resolvedTone];
    const distortionConfig = materialConfig["glass-distortion"];

    return (
        <GlassSurface
            {...distortionPreset}
            {...distortionConfig}
            {...restProps}
            className={cn(className)}
            style={style}
        >
            {children}
        </GlassSurface>
    );
}

export default AppSurface;
